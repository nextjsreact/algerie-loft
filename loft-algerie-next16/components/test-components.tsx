"use client"

import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function TestComponents() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test des Composants UI</CardTitle>
          <CardDescription>
            Vérification que tous les composants migrés fonctionnent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-input">Champ de test</Label>
              <Input id="test-input" placeholder="Tapez quelque chose..." />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button variant="default">Bouton par défaut</Button>
              <Button variant="outline">Bouton outline</Button>
              <Button variant="secondary">Bouton secondaire</Button>
              <Button variant="ghost">Bouton ghost</Button>
              <Button variant="destructive">Bouton destructif</Button>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm">Petit</Button>
              <Button size="default">Normal</Button>
              <Button size="lg">Grand</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}