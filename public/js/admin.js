// Configuração do Supabase (deve corresponder ao auth.js)
const SUPABASE_URL = "https://jjyjxfczkquvuapfzkit.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqeWp4ZmN6a3F1dnVhcGZ6a2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNzA0ODUsImV4cCI6MjA3Mjg0NjQ4NX0.y93bJv6OnAxMAkEFV4PVZlCBZRh_LrCNDG-4Al_o6JQ";

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
  },
});

// Função para criar um elemento HTML com classes e texto
function createElement(tag, classNames = [], textContent = "") {
  const el = document.createElement(tag);
  el.classList.add(...classNames);
  el.textContent = textContent;
  return el;
}

// Função para exibir notificações "toast"
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = createElement("div", [
    "toast",
    "p-4",
    "rounded-lg",
    "shadow-lg",
    "text-white",
    "text-sm",
    "font-medium",
    type === "success" ? "bg-green-500" : "bg-red-500",
  ]);
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000); // O toast desaparece após 5 segundos
}

// Função para exibir um toast de confirmação
function showConfirmationToast(message, onConfirm) {
  const container = document.getElementById("toast-container");

  // Remove qualquer toast de confirmação anterior para evitar duplicados
  const existingConfirmation = document.getElementById("confirmation-toast");
  if (existingConfirmation) {
    existingConfirmation.remove();
  }

  const toast = createElement("div", [
    "toast",
    "p-4",
    "rounded-lg",
    "shadow-lg",
    "text-white",
    "bg-gray-700",
  ]);
  toast.id = "confirmation-toast";

  const messageP = createElement("p", ["text-sm", "mb-3"], message);

  const btnGroup = createElement("div", ["flex", "justify-end", "space-x-2"]);

  const confirmBtn = createElement(
    "button",
    [
      "bg-red-600",
      "hover:bg-red-700",
      "text-white",
      "text-xs",
      "font-bold",
      "py-1",
      "px-2",
      "rounded",
    ],
    "Confirmar"
  );
  confirmBtn.onclick = () => {
    onConfirm();
    toast.remove();
  };

  const cancelBtn = createElement(
    "button",
    [
      "bg-gray-500",
      "hover:bg-gray-600",
      "text-white",
      "text-xs",
      "font-bold",
      "py-1",
      "px-2",
      "rounded",
    ],
    "Cancelar"
  );
  cancelBtn.onclick = () => toast.remove();

  btnGroup.append(confirmBtn, cancelBtn);
  toast.append(messageP, btnGroup);
  container.appendChild(toast);
}

// Função para formatar a data
function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("pt-PT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Função para criar uma linha da tabela de taxas
function createRateRow(rate) {
  const { id, name, bank_code, exchange_rate, updated_at } = rate;

  const tr = createElement("tr");
  tr.id = `row-${id}`;

  // Célula do Banco
  const tdBank = createElement("td", ["px-6", "py-4", "whitespace-nowrap"]);
  const bankName = createElement(
    "div",
    ["text-sm", "font-medium", "text-gray-900"],
    name || bank_code
  );
  const bankCode = createElement(
    "div",
    ["text-sm", "text-gray-500"],
    bank_code
  );
  if (name) tdBank.appendChild(bankName);
  tdBank.appendChild(bankCode);

  // Célula da Taxa (com modo de visualização e edição)
  const tdRate = createElement("td", ["px-6", "py-4", "whitespace-nowrap"]);
  const rateDisplay = createElement(
    "div",
    ["text-sm", "text-gray-900"],
    `${exchange_rate} Kz`
  );
  rateDisplay.id = `rate-display-${id}`;
  const rateEdit = createElement("div", ["hidden"]);
  rateEdit.id = `rate-edit-${id}`;
  const rateInput = createElement("input", [
    "w-full",
    "p-2",
    "border",
    "border-gray-300",
    "rounded-md",
  ]);
  rateInput.type = "number";
  rateInput.value = exchange_rate;
  rateEdit.appendChild(rateInput);
  tdRate.append(rateDisplay, rateEdit);

  // Célula da Data
  const tdDate = createElement(
    "td",
    ["px-6", "py-4", "whitespace-nowrap", "text-sm", "text-gray-500"],
    formatDate(updated_at)
  );
  tdDate.id = `date-${id}`;

  // Célula de Ações
  const tdAction = createElement("td", [
    "px-6",
    "py-4",
    "whitespace-nowrap",
    "text-right",
    "text-sm",
    "font-medium",
  ]);

  // Botão de Editar com texto e estilo
  const editBtn = createElement(
    "button",
    [
      "border",
      "border-yellow-500", // Cor da borda padrão
      "text-yellow-600", // Cor do texto padrão
      "hover:bg-yellow-500", // Cor de fundo no hover
      "hover:text-white", // Cor do texto no hover
      "px-3",
      "py-1",
      "rounded-md",
      "text-xs",
      "font-semibold",
      "transition",
    ],
    "Editar"
  );
  editBtn.id = `edit-btn-${id}`;
  editBtn.onclick = () => toggleEditMode(id);

  // Botão de Salvar com texto e estilo
  const saveBtn = createElement(
    "button",
    [
      "border",
      "border-green-500",
      "text-green-600", // Cor do texto padrão
      "hover:bg-green-500", // Cor de fundo no hover
      "hover:text-white",
      "px-3",
      "py-1",
      "rounded-md",
      "text-xs",
      "font-semibold",
      "transition",
      "hidden",
      "ml-2",
    ],
    "Salvar"
  );
  saveBtn.id = `save-btn-${id}`;
  saveBtn.onclick = () => saveRate(id);

  // Botão de Excluir com texto e estilo
  const deleteBtn = createElement(
    "button",
    [
      "border",
      "border-red-600", // Cor da borda padrão
      "text-red-600", // Cor do texto padrão
      "hover:bg-red-600", // Cor de fundo no hover
      "hover:text-white", // Cor do texto no hover
      "px-3",
      "py-1",
      "rounded-md",
      "text-xs",
      "font-semibold",
      "transition",
      "ml-2",
    ],
    "Excluir"
  );
  deleteBtn.id = `delete-btn-${id}`;
  deleteBtn.onclick = () => deleteRate(id);

  tdAction.append(editBtn, saveBtn, deleteBtn);

  tr.append(tdBank, tdRate, tdDate, tdAction);
  return tr;
}

// Alterna entre modo de visualização e edição
window.toggleEditMode = (id) => {
  const input = document.querySelector(`#rate-edit-${id} input`);
  // Limpa o estado de erro ao sair do modo de edição
  input.classList.remove(
    "border-red-500",
    "focus:border-red-500",
    "focus:ring-red-500"
  );

  document.getElementById(`rate-display-${id}`).classList.toggle("hidden");
  document.getElementById(`rate-edit-${id}`).classList.toggle("hidden");
  document.getElementById(`edit-btn-${id}`).classList.toggle("hidden");
  document.getElementById(`save-btn-${id}`).classList.toggle("hidden");
  // Esconde o botão de excluir quando em modo de edição para evitar confusão
  document.getElementById(`delete-btn-${id}`).classList.toggle("hidden");
};

// Salva a nova taxa
window.saveRate = async (id) => {
  const input = document.querySelector(`#rate-edit-${id} input`);
  const saveBtn = document.getElementById(`save-btn-${id}`);
  const newRateValue = input.value.trim(); // Remove espaços em branco
  const newRate = parseFloat(input.value);

  // Limpa o estado de erro anterior
  input.classList.remove(
    "border-red-500",
    "focus:border-red-500",
    "focus:ring-red-500"
  );

  if (newRateValue === "" || isNaN(newRate) || newRate <= 0) {
    showToast(
      "O campo da taxa não pode estar em branco e deve ser um número válido.",
      "error"
    );
    input.focus();
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Salvando...";

  try {
    const {
      data: { session },
    } = await _supabase.auth.getSession();
    const response = await fetch(`/api/update-rate/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ newRate }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Falha ao atualizar a taxa.");
    }

    const updatedRate = await response.json();

    // Atualiza a UI com os novos dados
    document.querySelector(
      `#rate-display-${id}`
    ).textContent = `${updatedRate.exchange_rate} Kz`;
    document.getElementById(`date-${id}`).textContent = formatDate(
      updatedRate.updated_at
    );

    // Volta para o modo de visualização
    toggleEditMode(id);
    showToast("Taxa atualizada com sucesso!", "success");
  } catch (error) {
    console.error("Erro ao salvar:", error);
    showToast(`Erro ao salvar: ${error.message}`, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Salvar";
  }
};

// Exclui uma taxa
window.deleteRate = async (id) => {
  showConfirmationToast(
    "Tem a certeza? Esta ação não pode ser desfeita.",
    async () => {
      await proceedWithDeletion(id);
    }
  );
};

async function proceedWithDeletion(id) {
  try {
    const {
      data: { session },
    } = await _supabase.auth.getSession();
    const response = await fetch(`/api/delete-rate/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Falha ao excluir a taxa.");
    }

    document.getElementById(`row-${id}`).remove(); // Remove a linha da tabela na UI
    showToast("Taxa excluída com sucesso!", "success");
  } catch (error) {
    console.error("Erro ao excluir:", error);
    showToast(`Erro ao excluir: ${error.message}`, "error");
  }
}

function toggleUserRoleEdit(userId, currentRole) {
  const roleCell = document.getElementById(`role-cell-${userId}`);
  const actionsCell = document.getElementById(`actions-cell-${userId}`);

  // Esconde o conteúdo atual
  roleCell.querySelector("span").classList.add("hidden");
  actionsCell.querySelector("button").classList.add("hidden");

  // Cria e mostra o dropdown de edição
  const select = createElement("select", [
    "w-full",
    "p-1",
    "border",
    "border-gray-300",
    "rounded-md",
    "text-xs",
  ]);
  select.innerHTML = `
    <option value="user" ${
      currentRole === "user" ? "selected" : ""
    }>user</option>
    <option value="admin" ${
      currentRole === "admin" ? "selected" : ""
    }>admin</option>
  `;
  roleCell.appendChild(select);

  // Cria e mostra o botão de salvar
  const saveBtn = createElement(
    "button",
    ["text-green-600", "hover:text-green-900", "text-sm", "font-medium"],
    "Salvar"
  );
  saveBtn.onclick = async () => {
    const newRole = select.value;
    saveBtn.textContent = "...";
    saveBtn.disabled = true;

    try {
      const {
        data: { session },
      } = await _supabase.auth.getSession();
      const response = await fetch(`/api/update-user-role/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao atualizar.");
      }

      // Atualiza a UI sem recarregar a página
      const roleBadge = roleCell.querySelector("span");
      roleBadge.textContent = newRole;
      roleBadge.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        newRole === "admin"
          ? "bg-red-100 text-red-800"
          : "bg-green-100 text-green-800"
      }`;

      // Remove os elementos de edição e mostra os de visualização
      select.remove();
      saveBtn.remove();
      roleBadge.classList.remove("hidden");
      actionsCell.querySelector("button").classList.remove("hidden");

      showToast("Função atualizada com sucesso!", "success");
    } catch (error) {
      showToast(`Erro: ${error.message}`, "error");
      saveBtn.textContent = "Salvar";
      saveBtn.disabled = false;
    }
  };
  actionsCell.appendChild(saveBtn);
}

function toggleUserCreditsEdit(userId, currentCredits) {
  const creditsCell = document.getElementById(`credits-cell-${userId}`);
  const actionsCell = document.getElementById(`actions-cell-${userId}`);

  // Esconde o conteúdo atual
  creditsCell.querySelector("span").classList.add("hidden");
  actionsCell
    .querySelectorAll("button")
    .forEach((btn) => btn.classList.add("hidden"));

  // Cria e mostra o input de edição
  const input = createElement("input", [
    "w-20",
    "p-1",
    "border",
    "border-gray-300",
    "rounded-md",
    "text-xs",
  ]);
  input.type = "number";
  input.value = currentCredits;
  creditsCell.appendChild(input);

  // Cria e mostra o botão de salvar
  const saveBtn = createElement(
    "button",
    [
      "text-green-600",
      "hover:text-green-900",
      "text-sm",
      "font-medium",
      "ml-2",
    ],
    "Salvar"
  );
  saveBtn.onclick = async () => {
    const newCredits = parseInt(input.value, 10);
    if (isNaN(newCredits) || newCredits < 0) {
      showToast("Valor de créditos inválido.", "error");
      return;
    }

    saveBtn.textContent = "...";
    saveBtn.disabled = true;

    try {
      const {
        data: { session },
      } = await _supabase.auth.getSession();
      const response = await fetch(`/api/update-user-credits/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ newCredits }),
      });

      if (!response.ok) throw new Error("Falha ao atualizar créditos.");

      // Atualiza a UI
      creditsCell.querySelector("span").textContent = newCredits;
      input.remove();
      saveBtn.remove();
      creditsCell.querySelector("span").classList.remove("hidden");
      actionsCell
        .querySelectorAll("button")
        .forEach((btn) => btn.classList.remove("hidden"));

      showToast("Créditos atualizados!", "success");
    } catch (error) {
      showToast(`Erro: ${error.message}`, "error");
      saveBtn.textContent = "Salvar";
      saveBtn.disabled = false;
    }
  };
  actionsCell.appendChild(saveBtn);
}
async function fetchAndDisplayCustomers() {
  const customersContainer = document.getElementById("customers-container");
  const loadingMessage = document.getElementById("customers-loading-message");

  try {
    const {
      data: { session },
    } = await _supabase.auth.getSession();
    const response = await fetch("/api/all-users", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) throw new Error("Não foi possível carregar os clientes.");
    const customers = await response.json();

    loadingMessage.classList.add("hidden");

    if (customers.length > 0) {
      // Atualiza o card de estatísticas com o total de clientes
      document.getElementById("total-customers-stat").textContent =
        customers.length;

      const thead = document.querySelector("#customers-panel thead");
      thead.innerHTML = `
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função (Role)</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créditos</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Registo</th>
          <th scope="col" class="relative px-6 py-3"><span class="sr-only">Ações</span></th>
        </tr>
      `;

      customersContainer.innerHTML = ""; // Limpa antes de adicionar
      customers.forEach((customer) => {
        const row = document.createElement("tr");
        const email = customer.user
          ? customer.user.email
          : "Email não disponível";
        const editRoleButton = `<button onclick="toggleUserRoleEdit('${customer.id}', '${customer.role}')" class="text-indigo-600 hover:text-indigo-900">Editar Função</button>`;
        const editCreditsButton = `<button onclick="toggleUserCreditsEdit('${customer.id}', ${customer.query_credits})" class="text-blue-600 hover:text-blue-900 ml-4">Editar Créditos</button>`;

        row.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${email}</div>
          </td>
          <td id="role-cell-${customer.id}" class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              customer.role === "admin"
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }">
              ${customer.role}
            </span>
          </td>
          <td id="credits-cell-${
            customer.id
          }" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            <span>${customer.query_credits}</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(
            customer.created_at
          )}</td>
          <td id="actions-cell-${
            customer.id
          }" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex">
            ${editRoleButton} ${editCreditsButton}
          </td>
        `;
        customersContainer.appendChild(row);
      });
    }
  } catch (error) {
    loadingMessage.textContent = error.message;
  }
}

// Função principal para inicializar o painel
async function initializeAdminPanel() {
  const ratesContainer = document.getElementById("rates-container");
  const loadingMessage = document.getElementById("loading-message");
  const adminPanel = document.getElementById("admin-panel");
  const logoutBtn = document.getElementById("logout-btn");
  const addRateForm = document.getElementById("add-rate-form");

  // Validação em tempo real para os campos do formulário de adição
  const newBankCodeInput = document.getElementById("new-bank-code");
  const newExchangeRateInput = document.getElementById("new-exchange-rate");

  // Permite apenas letras no código do banco
  newBankCodeInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-Z]/g, "");
  });

  // Garante que a taxa seja sempre um número positivo
  newExchangeRateInput.addEventListener("change", (e) => {
    if (parseFloat(e.target.value) < 0) {
      e.target.value = "";
    }
  });

  // 1. Verifica se o utilizador está autenticado e se é um administrador
  const {
    data: { session },
  } = await _supabase.auth.getSession();

  if (!session) {
    // Se não houver sessão, redireciona para a página de login
    window.location.href = "/login.html";
    return;
  }

  // Verifica a role do utilizador
  const { data: profile, error: profileError } = await _supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    // Se não for admin, redireciona para a calculadora principal
    window.location.href = "/index.html";
    return;
  }

  adminPanel.classList.remove("hidden");

  // 2. Lógica de Logout
  logoutBtn.addEventListener("click", async () => {
    await _supabase.auth.signOut();
    window.location.href = "/login.html";
  });

  // 3. Lógica para Adicionar Nova Taxa
  addRateForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(addRateForm);
    const newRateData = {
      bank_code: formData.get("bank_code"),
      exchange_rate: parseFloat(formData.get("exchange_rate")),
    };

    try {
      const {
        data: { session },
      } = await _supabase.auth.getSession();
      const response = await fetch("/api/add-rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(newRateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao adicionar a taxa.");
      }

      const addedRate = await response.json();
      const newRow = createRateRow(addedRate);
      ratesContainer.appendChild(newRow); // Adiciona a nova linha à tabela
      addRateForm.reset(); // Limpa o formulário
      showToast("Banco adicionado com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao adicionar taxa:", error);
      showToast(`Erro: ${error.message}`, "error");
    }
  });

  // 4. Busca e exibe as taxas existentes
  try {
    const response = await fetch("/api/all-rates");
    if (!response.ok) throw new Error("Não foi possível carregar as taxas.");
    const rates = await response.json();

    loadingMessage.classList.add("hidden"); // Esconde a mensagem de carregamento

    if (rates.length > 0) {
      // Adiciona o cabeçalho da tabela
      const thead = document.querySelector("thead");
      // Atualiza o card de estatísticas
      document.getElementById("total-banks-stat").textContent = rates.length;

      thead.innerHTML = `
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banco</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxa</th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Atualização</th>
          <th scope="col" class="relative px-6 py-3"><span class="sr-only">Ação</span></th>
        </tr>
      `;
      // Preenche a tabela com os dados
      rates.forEach((rate) => {
        const row = createRateRow(rate);
        ratesContainer.appendChild(row);
      });
    } else {
      loadingMessage.textContent = "Nenhuma taxa encontrada.";
      loadingMessage.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Erro:", error);
    loadingMessage.textContent = error.message;
    loadingMessage.classList.add("text-red-500");
    loadingMessage.classList.remove("hidden");
  }

  // 5. Busca e exibe os clientes
  fetchAndDisplayCustomers();
}

document.addEventListener("DOMContentLoaded", initializeAdminPanel);
