-- =============================================
-- FONCTIONS RPC POUR LE CLONAGE PROFESSIONNEL
-- =============================================

-- Fonction pour récupérer le schéma complet de la base
CREATE OR REPLACE FUNCTION get_schema()
RETURNS jsonb AS $$
DECLARE
    schema_info jsonb;
    table_info jsonb;
    column_info jsonb;
    constraint_info jsonb;
    index_info jsonb;
BEGIN
    -- Récupérer les informations des tables
    SELECT jsonb_agg(
        jsonb_build_object(
            'table_name', t.table_name,
            'columns', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'column_name', c.column_name,
                        'data_type', c.data_type,
                        'is_nullable', c.is_nullable,
                        'column_default', c.column_default,
                        'character_maximum_length', c.character_maximum_length,
                        'numeric_precision', c.numeric_precision,
                        'numeric_scale', c.numeric_scale
                    )
                )
                FROM information_schema.columns c
                WHERE c.table_name = t.table_name
                AND c.table_schema = 'public'
            ),
            'constraints', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'constraint_name', tc.constraint_name,
                        'constraint_type', tc.constraint_type,
                        'column_name', kcu.column_name,
                        'referenced_table', ccu.table_name,
                        'referenced_column', ccu.column_name
                    )
                )
                FROM information_schema.table_constraints tc
                LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                LEFT JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
                WHERE tc.table_name = t.table_name
                AND tc.table_schema = 'public'
            )
        )
    ) INTO table_info
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE';

    -- Récupérer les index
    SELECT jsonb_agg(
        jsonb_build_object(
            'table_name', t.table_name,
            'index_name', i.indexname,
            'column_name', a.attname,
            'is_unique', i.indisunique,
            'is_primary', i.indisprimary
        )
    ) INTO index_info
    FROM pg_indexes i
    JOIN pg_class t ON i.tablename = t.relname
    JOIN pg_attribute a ON a.attrelid = t.oid
    WHERE i.schemaname = 'public'
    AND a.attnum > 0;

    -- Construire le schéma complet
    schema_info := jsonb_build_object(
        'tables', table_info,
        'indexes', index_info,
        'timestamp', now()
    );

    RETURN schema_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour appliquer un schéma à la base
CREATE OR REPLACE FUNCTION apply_schema(schema_data jsonb)
RETURNS text AS $$
DECLARE
    table_record record;
    column_record record;
    constraint_record record;
    index_record record;
    sql_command text;
    result text := '';
BEGIN
    -- Supprimer les tables existantes (sauf les tables système)
    FOR table_record IN
        SELECT DISTINCT table_name
        FROM jsonb_array_elements_text(
            CASE
                WHEN schema_data->'tables' IS NOT NULL
                THEN (SELECT jsonb_agg(el->>'table_name') FROM jsonb_array_elements(schema_data->'tables') el)
                ELSE '[]'::jsonb
            END
        ) AS table_name
        WHERE table_name NOT IN ('profiles', 'auth_users')
    LOOP
        BEGIN
            EXECUTE 'DROP TABLE IF EXISTS ' || table_record.table_name || ' CASCADE';
            result := result || 'Table ' || table_record.table_name || ' supprimée. ';
        EXCEPTION
            WHEN OTHERS THEN
                result := result || 'Erreur suppression ' || table_record.table_name || ': ' || SQLERRM || '. ';
        END;
    END LOOP;

    -- Recréer les tables
    FOR table_record IN
        SELECT * FROM jsonb_array_elements(schema_data->'tables') AS table_def
    LOOP
        sql_command := 'CREATE TABLE ' || (table_record->>'table_name') || ' (';

        -- Ajouter les colonnes
        FOR column_record IN
            SELECT * FROM jsonb_array_elements(table_record->'columns') AS col_def
        LOOP
            sql_command := sql_command ||
                (col_def->>'column_name') || ' ' ||
                (col_def->>'data_type');

            -- Ajouter la longueur si spécifiée
            IF col_def->>'character_maximum_length' IS NOT NULL THEN
                sql_command := sql_command || '(' || (col_def->>'character_maximum_length') || ')';
            END IF;

            -- Ajouter la précision numérique si spécifiée
            IF col_def->>'numeric_precision' IS NOT NULL THEN
                sql_command := sql_command || '(' || (col_def->>'numeric_precision');
                IF col_def->>'numeric_scale' IS NOT NULL THEN
                    sql_command := sql_command || ',' || (col_def->>'numeric_scale');
                END IF;
                sql_command := sql_command || ')';
            END IF;

            -- Ajouter NOT NULL si nécessaire
            IF (col_def->>'is_nullable') = 'NO' THEN
                sql_command := sql_command || ' NOT NULL';
            END IF;

            -- Ajouter la valeur par défaut si spécifiée
            IF col_def->>'column_default' IS NOT NULL THEN
                sql_command := sql_command || ' DEFAULT ' || (col_def->>'column_default');
            END IF;

            sql_command := sql_command || ', ';
        END LOOP;

        -- Supprimer la dernière virgule
        sql_command := rtrim(sql_command, ', ');

        sql_command := sql_command || ')';

        BEGIN
            EXECUTE sql_command;
            result := result || 'Table ' || (table_record->>'table_name') || ' créée. ';
        EXCEPTION
            WHEN OTHERS THEN
                result := result || 'Erreur création ' || (table_record->>'table_name') || ': ' || SQLERRM || '. ';
        END;
    END LOOP;

    -- Ajouter les contraintes
    FOR constraint_record IN
        SELECT * FROM jsonb_array_elements(schema_data->'constraints') AS constraint_def
    LOOP
        IF (constraint_record->>'constraint_type') = 'PRIMARY KEY' THEN
            sql_command := 'ALTER TABLE ' || (constraint_record->>'table_name') ||
                          ' ADD PRIMARY KEY (' || (constraint_record->>'column_name') || ')';
        ELSIF (constraint_record->>'constraint_type') = 'FOREIGN KEY' THEN
            sql_command := 'ALTER TABLE ' || (constraint_record->>'table_name') ||
                          ' ADD CONSTRAINT ' || (constraint_record->>'constraint_name') ||
                          ' FOREIGN KEY (' || (constraint_record->>'column_name') || ')' ||
                          ' REFERENCES ' || (constraint_record->>'referenced_table') ||
                          ' (' || (constraint_record->>'referenced_column') || ')';
        END IF;

        IF sql_command IS NOT NULL THEN
            BEGIN
                EXECUTE sql_command;
                result := result || 'Contrainte ' || (constraint_record->>'constraint_name') || ' ajoutée. ';
            EXCEPTION
                WHEN OTHERS THEN
                    result := result || 'Erreur contrainte ' || (constraint_record->>'constraint_name') || ': ' || SQLERRM || '. ';
            END;
        END IF;
    END LOOP;

    -- Ajouter les index
    FOR index_record IN
        SELECT * FROM jsonb_array_elements(schema_data->'indexes') AS index_def
    LOOP
        IF (index_record->>'is_unique')::boolean THEN
            sql_command := 'CREATE UNIQUE INDEX ' || (index_record->>'index_name') ||
                          ' ON ' || (index_record->>'table_name') || ' (' || (index_record->>'column_name') || ')';
        ELSE
            sql_command := 'CREATE INDEX ' || (index_record->>'index_name') ||
                          ' ON ' || (index_record->>'table_name') || ' (' || (index_record->>'column_name') || ')';
        END IF;

        BEGIN
            EXECUTE sql_command;
            result := result || 'Index ' || (index_record->>'index_name') || ' créé. ';
        EXCEPTION
            WHEN OTHERS THEN
                result := result || 'Erreur index ' || (index_record->>'index_name') || ': ' || SQLERRM || '. ';
        END;
    END LOOP;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour exécuter du SQL brut (utilisée par le script)
CREATE OR REPLACE FUNCTION execute_sql(sql_command text)
RETURNS text AS $$
BEGIN
    EXECUTE sql_command;
    RETURN 'SQL exécuté avec succès';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Erreur SQL: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_schema() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION apply_schema(jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated, service_role;