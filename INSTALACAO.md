# Holy Voice - Guia de Instalação

## Requisitos do Sistema

### Sistema Operacional
- **Windows 10** ou superior (64-bit)
- **4 GB** de RAM mínimo (8 GB recomendado)
- **1 GB** de espaço livre em disco
- Conexão com a Internet

### Hardware de Áudio
- **Placa de som** compatível
- **Mesa de som** com saída auxiliar
- **Cabo P10-P2** para conexão da mesa ao computador
- **Microfone** conectado à mesa de som

## Instalação

### Passo 1: Download
1. Acesse o site oficial do Holy Voice
2. Clique em **"Download"**
3. Aguarde o download do arquivo `HolyVoice-Setup.exe`

### Passo 2: Instalação
1. Execute o arquivo `HolyVoice-Setup.exe` como **Administrador**
2. Clique em **"Próximo"** para continuar
3. Aceite os termos de licença
4. Escolha o local de instalação (padrão: `C:\Program Files\Holy Voice`)
5. Clique em **"Instalar"**
6. Aguarde a conclusão da instalação
7. Clique em **"Concluir"**

### Passo 3: Configuração Inicial
1. Execute o **Holy Voice**
2. Na primeira execução, o sistema solicitará permissões:
   - **Acesso ao microfone**: Clique em **"Permitir"**
   - **Acesso à rede**: Clique em **"Permitir"**

## Configuração do Holyrics

### Passo 1: Ativar API do Holyrics
1. Abra o **Holyrics**
2. Vá em **Configurações** → **Sistema** → **API**
3. Marque **"Ativar API"**
4. Defina uma **senha** para a API
5. Anote o **Token** gerado
6. Clique em **"Salvar"**

### Passo 2: Conectar Holy Voice ao Holyrics
1. No **Holy Voice**, clique em **"Conectar ao Holyrics"**
2. Insira as informações:
   - **IP do Holyrics**: (geralmente `localhost` ou IP da rede)
   - **Porta**: 8080 (padrão)
   - **Token**: Token gerado no Holyrics
3. Clique em **"Conectar"**
4. Aguarde a confirmação de conexão

## Configuração de Áudio

### Mesa de Som
1. Conecte o cabo **P10** na saída **AUX** da mesa de som
2. Conecte o cabo **P2** na entrada **Line In** do computador
3. Configure o volume da mesa em **70-80%**

### Windows
1. Clique com o botão direito no ícone de **som** na barra de tarefas
2. Selecione **"Dispositivos de gravação"**
3. Selecione o dispositivo **"Line In"**
4. Clique em **"Propriedades"**
5. Na aba **"Níveis"**, ajuste para **60-70%**
6. Na aba **"Avançado"**, defina qualidade para **"CD Quality (16 bit, 44100 Hz)"**
7. Clique em **"OK"**

### Holy Voice
1. No aplicativo, acesse **Configurações** → **Áudio**
2. Selecione o dispositivo de entrada: **"Line In"**
3. Ajuste a **sensibilidade** para **60%**
4. Ative **"Redução de ruído"**
5. Ative **"Cancelamento de eco"**

## Teste de Funcionamento

### Teste de Conexão
1. No Holy Voice, verifique se o status mostra **"Conectado"**
2. Teste com comando: **"abrir bíblia"**
3. O Holyrics deve abrir a bíblia automaticamente

### Teste de Áudio
1. Fale no microfone conectado à mesa
2. Verifique se o indicador de áudio no Holy Voice responde
3. Teste com: **"João 3 16"**
4. O versículo deve aparecer no telão

### Comandos de Teste
- **"abrir bíblia"** - Abre a bíblia
- **"fechar bíblia"** - Fecha a bíblia e mostra tema principal
- **"próximo versículo"** - Próximo versículo
- **"versículo anterior"** - Versículo anterior
- **"Salmos 23 1"** - Abre Salmos 23:1

## Comandos Disponíveis

### Navegação Bíblica
- **"[Livro] [Capítulo] [Versículo]"** - Ex: "Gênesis 1 1"
- **"próximo versículo"**
- **"versículo anterior"**
- **"abrir bíblia"**
- **"fechar bíblia"**

### Imagens
- **"[nome da imagem]"** - Ex: "cruz", "pomba"
- Acesse a galeria para ver todas as imagens disponíveis

### Telas Especiais
- Tecla **F8** - Papel de parede
- Tecla **F9** - Tela vazia
- Tecla **F10** - Tela preta

## Solução de Problemas

### Problemas de Conexão
- Verifique se o Holyrics está rodando
- Confirme se a API está ativada
- Verifique se o firewall não está bloqueando
- Teste com `ping localhost` no prompt

### Problemas de Áudio
- Verifique se o cabo está bem conectado
- Teste o microfone diretamente no Windows
- Ajuste os níveis de gravação
- Reinicie o Holy Voice se necessário

### Performance
- Feche outros programas desnecessários
- Verifique se há atualizações disponíveis
- Reinicie o computador se o sistema estiver lento

## Suporte Técnico

Para suporte adicional:
- **Manual Completo**: [Link para documentação]
- **Vídeos Tutoriais**: [Link para YouTube]
- **Forum da Comunidade**: [Link para forum]
- **Contato**: suporte@holyvoice.com

---

**Holy Voice** - Controle Inteligente para Holyrics
© 2024 - Todos os direitos reservados