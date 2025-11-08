# Ponto Móvel Gastronômico

## 1. Descrição

O **Ponto Móvel Gastronômico** é um aplicativo de ponto móvel progressivo (PWA) desenvolvido em Angular para funcionários do setor de restaurantes. Integrado a um sistema ERP gastronômico, ele permite que os funcionários registrem suas entradas, saídas e pausas de forma rápida e segura, além de fornecer acesso a informações essenciais de RH.

O aplicativo foi projetado com uma interface moderna e responsiva, utilizando Tailwind CSS, e é otimizado para uma experiência de usuário fluida em qualquer dispositivo.

---

## 2. Funcionalidades Principais

- **Seleção de Funcionário e Autenticação por PIN:**
  - Tela inicial exibe uma lista de funcionários cadastrados.
  - Autenticação segura através de um PIN pessoal de 4 dígitos para cada funcionário.
  - A sessão do usuário é mantida para acesso rápido ao portal.

- **Portal do Colaborador:**
  - Hub central com acesso rápido a todas as funcionalidades.
  - Exibe a última ação de ponto registrada (entrada, saída, etc.).
  - Logout seguro.

- **Registro de Ponto (`Bater Ponto`):**
  - Funcionalidade principal que permite registrar início de turno, início de pausa, fim de pausa e fim de turno.
  - Ação confirmada via modal com inserção do PIN, garantindo segurança.

- **Espelho de Ponto:**
  - Visualização detalhada dos registros de ponto.
  - Filtros por "Esta Semana" e "Este Mês".
  - Calcula e exibe o total de horas trabalhadas no período selecionado.

- **Minha Escala:**
  - Exibe a escala de trabalho do funcionário para a semana corrente.
  - Mostra os horários de turnos e dias de folga de forma clara.

- **Meus Holerites:**
  - Acesso aos resumos da folha de pagamento (holerites).
  - Permite a seleção de mês e ano para consulta de períodos anteriores.
  - Detalha horas trabalhadas, horas extras, pagamento base e total a receber.

- **Solicitação de Ausências:**
  - Permite que os funcionários solicitem ausências como férias, folgas, faltas justificadas e atestados.
  - Formulário para submeter novas solicitações com datas, motivo e **anexo de arquivos** (PDF, imagens, etc.).
  - Histórico de todas as solicitações com status (Pendente, Aprovado, Rejeitado).

- **Configuração por QR Code:**
  - Configuração inicial do aplicativo de forma rápida e segura através da leitura de um QR Code.
  - Elimina a necessidade de inserção manual de credenciais.

---

## 3. Tech Stack

- **Framework:** Angular v20+ (utilizando componentes Standalone e arquitetura Zoneless para alta performance).
- **Gerenciamento de Estado:** Angular Signals.
- **Roteamento:** `@angular/router` com `withHashLocation`.
- **Estilização:** Tailwind CSS.
- **Requisições HTTP:** `@angular/common/http` com `HttpClient`.
- **Reatividade:** RxJS.
- **Linguagem:** TypeScript.
- **QR Code Scanning:** `html5-qrcode`.

---

## 4. Configuração e Inicialização

Para que o aplicativo funcione, é necessário primeiro configurá-lo com as credenciais do restaurante. A configuração é feita através da leitura de um QR Code.

1.  Ao abrir o aplicativo pela primeira vez, você verá a tela de boas-vindas.
2.  Clique no botão **"Escanear QR Code"**.
3.  Permita o acesso à câmera do seu dispositivo, se solicitado.
4.  Aponte a câmera para o QR Code fornecido pelo seu sistema ERP.

Após a leitura bem-sucedida, o aplicativo salvará as credenciais e carregará automaticamente a lista de funcionários, ficando pronto para uso.

### Formato do QR Code

O aplicativo suporta dois formatos para o conteúdo do QR Code para garantir flexibilidade:

**Formato 1: String Simples (Recomendado)**

Uma string com o ID do restaurante e a chave da API, separados por um ponto e vírgula (`;`).

`SEU_USER_ID;SUA_CHAVE_DE_API_EXTERNA`

**Formato 2: JSON (Compatibilidade)**

Um objeto JSON com as chaves `restaurantId` e `apiKey`.

```json
{
  "restaurantId": "SEU_USER_ID",
  "apiKey": "SUA_CHAVE_DE_API_EXTERNA"
}
```

---

## 5. Integração com a API

O aplicativo se comunica com uma API RESTful para buscar e enviar dados. Todos os endpoints estão localizados sob a base `https://gastro.koresolucoes.com.br/api/rh`.

**Parâmetros Comuns:**
- `restaurantId`: ID do restaurante, enviado como query parameter.
- `Authorization`: `Bearer <API_KEY>`, enviado no cabeçalho HTTP.

### Endpoints Utilizados:

| Método | Endpoint                    | Descrição                                                                 |
| :----- | :-------------------------- | :------------------------------------------------------------------------ |
| `GET`  | `/funcionarios`             | Lista todos os funcionários ativos.                                       |
| `POST` | `/verificar-pin`            | Valida o PIN de um funcionário para login.                                |
| `POST` | `/ponto/bater-ponto`        | Registra um evento de ponto (entrada, pausa, etc.).                       |
| `GET`  | `/ponto`                    | Obtém os registros de ponto de um funcionário para um período.            |
| `GET`  | `/escalas`                  | Obtém as escalas de trabalho publicadas para um período.                  |
| `GET`  | `/folha-pagamento`          | Obtém os dados do holerite de um funcionário para um mês/ano.             |
| `GET`  | `/ausencias`                | Lista as solicitações de ausência de um funcionário.                      |
| `POST` | `/ausencias`                | Cria uma nova solicitação de ausência (com suporte a anexos em base64).   |