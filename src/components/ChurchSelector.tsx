import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Church, useChurches } from "@/hooks/useChurches";
import { Building2, Plus, Settings, Wifi } from "lucide-react";

interface ChurchSelectorProps {
  onChurchSelect: (church: Church) => void;
}

export const ChurchSelector = ({ onChurchSelect }: ChurchSelectorProps) => {
  const { churches, selectedChurch, loading, createChurch, updateChurch, selectChurch } = useChurches();
  const [isNewChurchDialogOpen, setIsNewChurchDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    holyrics_ip: 'localhost',
    holyrics_port: 8080,
    api_key: '',
    token: ''
  });

  const handleCreateChurch = async () => {
    if (!formData.name.trim()) return;

    const result = await createChurch({
      name: formData.name.trim(),
      holyrics_ip: formData.holyrics_ip,
      holyrics_port: formData.holyrics_port,
      api_key: formData.api_key || undefined,
      token: formData.token || undefined
    });

    if (result) {
      setIsNewChurchDialogOpen(false);
      setFormData({
        name: '',
        holyrics_ip: 'localhost',
        holyrics_port: 8080,
        api_key: '',
        token: ''
      });
      selectChurch(result);
      onChurchSelect(result);
    }
  };

  const handleUpdateChurch = async () => {
    if (!selectedChurch) return;

    const result = await updateChurch(selectedChurch.id, {
      holyrics_ip: formData.holyrics_ip,
      holyrics_port: formData.holyrics_port,
      api_key: formData.api_key || undefined,
      token: formData.token || undefined
    });

    if (result) {
      setIsConfigDialogOpen(false);
      onChurchSelect(result);
    }
  };

  const handleChurchSelect = (churchId: string) => {
    const church = churches.find(c => c.id === churchId);
    if (church) {
      selectChurch(church);
      onChurchSelect(church);
    }
  };

  const openConfigDialog = () => {
    if (selectedChurch) {
      setFormData({
        name: selectedChurch.name,
        holyrics_ip: selectedChurch.holyrics_ip,
        holyrics_port: selectedChurch.holyrics_port,
        api_key: selectedChurch.api_key || '',
        token: selectedChurch.token || ''
      });
      setIsConfigDialogOpen(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Seleção de Igreja
        </CardTitle>
        <CardDescription>
          Selecione ou configure uma igreja para usar o Holy Voice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Select
              value={selectedChurch?.id || ""}
              onValueChange={handleChurchSelect}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar igreja..." />
              </SelectTrigger>
              <SelectContent>
                {churches.map((church) => (
                  <SelectItem key={church.id} value={church.id}>
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      {church.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isNewChurchDialogOpen} onOpenChange={setIsNewChurchDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Igreja</DialogTitle>
                <DialogDescription>
                  Adicione uma nova igreja ao sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="church-name">Nome da Igreja</Label>
                  <Input
                    id="church-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Igreja Batista Central"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="holyrics-ip">IP do Holyrics</Label>
                    <Input
                      id="holyrics-ip"
                      value={formData.holyrics_ip}
                      onChange={(e) => setFormData(prev => ({ ...prev, holyrics_ip: e.target.value }))}
                      placeholder="localhost"
                    />
                  </div>
                  <div>
                    <Label htmlFor="holyrics-port">Porta</Label>
                    <Input
                      id="holyrics-port"
                      type="number"
                      value={formData.holyrics_port}
                      onChange={(e) => setFormData(prev => ({ ...prev, holyrics_port: parseInt(e.target.value) || 8080 }))}
                      placeholder="8080"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="api-key">API Key (opcional)</Label>
                  <Input
                    id="api-key"
                    value={formData.api_key}
                    onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                    placeholder="Chave da API do Holyrics"
                  />
                </div>
                <div>
                  <Label htmlFor="token">Token (opcional)</Label>
                  <Input
                    id="token"
                    value={formData.token}
                    onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
                    placeholder="Token de acesso do Holyrics"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewChurchDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateChurch} disabled={!formData.name.trim()}>
                  Criar Igreja
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {selectedChurch && (
            <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" onClick={openConfigDialog}>
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configurações - {selectedChurch.name}</DialogTitle>
                  <DialogDescription>
                    Configure as conexões do Holyrics para esta igreja
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="config-ip">IP do Holyrics</Label>
                      <Input
                        id="config-ip"
                        value={formData.holyrics_ip}
                        onChange={(e) => setFormData(prev => ({ ...prev, holyrics_ip: e.target.value }))}
                        placeholder="localhost"
                      />
                    </div>
                    <div>
                      <Label htmlFor="config-port">Porta</Label>
                      <Input
                        id="config-port"
                        type="number"
                        value={formData.holyrics_port}
                        onChange={(e) => setFormData(prev => ({ ...prev, holyrics_port: parseInt(e.target.value) || 8080 }))}
                        placeholder="8080"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="config-api-key">API Key</Label>
                    <Input
                      id="config-api-key"
                      value={formData.api_key}
                      onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                      placeholder="Chave da API do Holyrics"
                    />
                  </div>
                  <div>
                    <Label htmlFor="config-token">Token</Label>
                    <Input
                      id="config-token"
                      value={formData.token}
                      onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
                      placeholder="Token de acesso do Holyrics"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateChurch}>
                    Salvar Configurações
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {selectedChurch && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-sm font-medium">{selectedChurch.name}</div>
            <div className="text-xs text-muted-foreground">
              {selectedChurch.holyrics_ip}:{selectedChurch.holyrics_port}
            </div>
            {selectedChurch.api_key && (
              <div className="text-xs text-green-600">API configurada</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};