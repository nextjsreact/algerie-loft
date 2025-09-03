"use client";

import { useState, useEffect } from "react";
import { LoftPhotos } from "@/components/lofts/loft-photos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";

interface Loft {
  id: string;
  name: string;
  address: string;
}

export default function TestPhotosPage() {
  const [lofts, setLofts] = useState<Loft[]>([]);
  const [selectedLoft, setSelectedLoft] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadLofts();
  }, []);

  const loadLofts = async () => {
    try {
      const { data, error } = await supabase
        .from("lofts")
        .select("id, name, address")
        .order("name");

      if (error) {
        console.error("Erreur lors du chargement des lofts:", error);
        return;
      }

      setLofts(data || []);
      if (data && data.length > 0) {
        setSelectedLoft(data[0].id);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des lofts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Upload Photos</h1>
        <p className="text-muted-foreground">
          Page de test pour l'upload de photos des lofts
        </p>
      </div>

      {lofts.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Aucun loft trouvé. Veuillez d'abord exécuter le script insert-heaven-loft.sql
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner un Loft</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={selectedLoft}
                onChange={(e) => setSelectedLoft(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {lofts.map((loft) => (
                  <option key={loft.id} value={loft.id}>
                    {loft.name} - {loft.address}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {selectedLoft && <LoftPhotos loftId={selectedLoft} />}
        </>
      )}
    </div>
  );
}