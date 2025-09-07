document.addEventListener("DOMContentLoaded", () => {
  const ratesContainer = document.getElementById("rates-container");

  // Função para criar o HTML de cada linha de taxa
  function createRateRow(rate) {
    const { id, name, bank_code, exchange_rate, updated_at } = rate;
    // Garante que a data é válida antes de formatar
    const formattedDate = updated_at
      ? new Date(updated_at).toLocaleString("pt-PT", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

    // Lógica para exibir o nome ou apenas o código do banco
    const bankDisplayHTML = name
      ? `<p class="font-semibold text-gray-800">${name}</p><p class="text-sm text-gray-500">${bank_code}</p>`
      : `<p class="font-semibold text-gray-800">${bank_code}</p>`;

    return `
      <div id="row-${id}" class="grid grid-cols-4 gap-4 items-center p-4 border-b border-gray-200">
        <!-- Coluna Banco -->
        <div>
          ${bankDisplayHTML}
        </div>
        <!-- Coluna Taxa -->
        <div class="text-lg text-gray-700" id="rate-display-${id}">
          <span class="rate-value">${exchange_rate}</span> Kz
        </div>
        <div class="hidden" id="rate-edit-${id}">
          <input
            type="number"
            value="${exchange_rate}"
            class="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <!-- Coluna Última Atualização -->
        <div class="text-sm text-gray-600" id="date-${id}">
          ${formattedDate}
        </div>
        <!-- Coluna Ação -->
        <div>
          <button
            id="edit-btn-${id}"
            class="w-full bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-700 transition"
            onclick="toggleEditMode(${id})"
          >
            Editar
          </button>
          <button
            id="save-btn-${id}"
            class="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition hidden"
            onclick="saveRate(${id})"
          >
            Salvar
          </button>
        </div>
      </div>
    `;
  }

  // Função para buscar e exibir as taxas
  async function fetchAndDisplayRates() {
    try {
      const response = await fetch("/api/all-rates");
      if (!response.ok) throw new Error("Não foi possível carregar as taxas.");
      const rates = await response.json();

      if (rates.length > 0) {
        ratesContainer.innerHTML = `
          <div class="grid grid-cols-4 gap-4 font-bold text-gray-500 px-4 pb-2 border-b-2 border-gray-300">
            <span>Banco</span>
            <span>Taxa</span>
            <span>Última Atualização</span>
            <span>Ação</span>
          </div>
          ${rates.map(createRateRow).join("")}
        `;
      } else {
        ratesContainer.innerHTML =
          '<p class="text-center text-gray-500">Nenhuma taxa encontrada.</p>';
      }
    } catch (error) {
      console.error("Erro:", error);
      ratesContainer.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
    }
  }

  // Alterna entre modo de visualização e edição
  window.toggleEditMode = (id) => {
    document.getElementById(`rate-display-${id}`).classList.toggle("hidden");
    document.getElementById(`rate-edit-${id}`).classList.toggle("hidden");
    document.getElementById(`edit-btn-${id}`).classList.toggle("hidden");
    document.getElementById(`save-btn-${id}`).classList.toggle("hidden");
  };

  // Salva a nova taxa
  window.saveRate = async (id) => {
    const input = document.querySelector(`#rate-edit-${id} input`);
    const newRate = parseFloat(input.value);

    if (isNaN(newRate) || newRate <= 0) {
      alert("Por favor, insira um valor de taxa válido.");
      return;
    }

    try {
      const response = await fetch(`/api/update-rate/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao atualizar a taxa.");
      }

      const updatedRate = await response.json();

      // Atualiza a UI com os novos dados
      const rateValueSpan = document.querySelector(
        `#rate-display-${id} .rate-value`
      );
      rateValueSpan.textContent = updatedRate.exchange_rate;

      const dateDiv = document.getElementById(`date-${id}`);
      dateDiv.textContent = new Date(updatedRate.updated_at).toLocaleString(
        "pt-PT",
        {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      // Volta para o modo de visualização
      toggleEditMode(id);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert(`Erro ao salvar: ${error.message}`);
    }
  };

  // Busca as taxas quando a página carrega
  fetchAndDisplayRates();
});
