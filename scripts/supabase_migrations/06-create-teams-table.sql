CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    team_id UUID,
    user_id UUID,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status CHECK (status IN ('todo', 'in_progress', 'completed')) DEFAULT 'todo'::task_status NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    assigned_to UUID,
    team_id UUID,
    loft_id UUID,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (loft_id) REFERENCES lofts(id) ON DELETE CASCADE
);
