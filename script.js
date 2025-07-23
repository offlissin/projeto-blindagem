const form = document.getElementById('form-carro');
const listaCarros = document.getElementById('lista-carros') || document.createElement('div');
listaCarros.id = 'lista-carros';
document.body.appendChild(listaCarros);

let carroEditandoId = null; // Usado para saber se estamos editando

window.onload = () => {
  exibirTodosCarros();
};

form.addEventListener('submit', function (event) {
  event.preventDefault();

  const placa = document.getElementById('placa').value;
  const dataBlindagem = new Date(document.getElementById('dataBlindagem').value);
  const imagemInput = document.getElementById('imagemCarro');
  const imagem = imagemInput.files[0];

  if (carroEditandoId !== null) {
    atualizarCarro(placa, dataBlindagem, imagem);
  } else {
    if (!imagem) {
      alert("Selecione uma imagem!");
      return;
    }

    const leitor = new FileReader();
    leitor.onload = function (e) {
      const novoCarro = {
        id: Date.now(),
        placa: placa,
        dataBlindagem: dataBlindagem.toISOString(),
        imagem: e.target.result
      };

      salvarCarro(novoCarro);
      exibirTodosCarros();
      form.reset();
    };
    leitor.readAsDataURL(imagem);
  }
});

function salvarCarro(carro) {
  const carros = JSON.parse(localStorage.getItem('carros')) || [];
  carros.push(carro);
  localStorage.setItem('carros', JSON.stringify(carros));
}

function atualizarCarro(placa, dataBlindagem, novaImagem) {
  const carros = JSON.parse(localStorage.getItem('carros')) || [];
  const index = carros.findIndex(c => c.id === carroEditandoId);

  if (index !== -1) {
    if (novaImagem) {
      const leitor = new FileReader();
      leitor.onload = function (e) {
        carros[index].imagem = e.target.result;
        carros[index].placa = placa;
        carros[index].dataBlindagem = dataBlindagem.toISOString();
        salvarLista(carros);
      };
      leitor.readAsDataURL(novaImagem);
    } else {
      carros[index].placa = placa;
      carros[index].dataBlindagem = dataBlindagem.toISOString();
      salvarLista(carros);
    }
  }

  carroEditandoId = null;
  form.reset();
}

function salvarLista(lista) {
  localStorage.setItem('carros', JSON.stringify(lista));
  exibirTodosCarros();
}

function exibirTodosCarros(filtro = 'todos') {
  listaCarros.innerHTML = '';
  const carros = JSON.parse(localStorage.getItem('carros')) || [];

  carros.forEach(carro => {
    const dataBlindagem = new Date(carro.dataBlindagem);
    const dataRevisao = new Date(dataBlindagem);
    dataRevisao.setDate(dataRevisao.getDate() + 180);
    const diasRestantes = Math.ceil((dataRevisao - new Date()) / (1000 * 60 * 60 * 24));

    // Aplica o filtro
    if (
      (filtro === 'vencido' && diasRestantes < 0) ||
     (filtro === 'proximo' && diasRestantes >= 0 && diasRestantes <= 10) ||
      (filtro === 'emdia' && diasRestantes > 15) ||
      (filtro === 'todos')
    ) {
      const card = document.createElement('div');
      card.classList.add('card');

      const img = document.createElement('img');
      img.src = carro.imagem;

      const info = document.createElement('div');
      info.classList.add('info');

      info.innerHTML = `
        <p><strong>Placa:</strong> ${carro.placa}</p>
        <p><strong>Data da Blindagem:</strong> ${dataBlindagem.toLocaleDateString()}</p>
        <p><strong>Dias para Revisão:</strong> ${diasRestantes}</p>
        <button onclick="editarCarro(${carro.id})">Editar</button>
        <button onclick="removerCarro(${carro.id})">Remover</button>
      `;

      card.appendChild(img);
      card.appendChild(info);
      listaCarros.appendChild(card);
    }
  });
}
function filtrar(tipo) {
  exibirTodosCarros(tipo);
}
function exportarExcel() {
  const carros = JSON.parse(localStorage.getItem('carros')) || [];

  const dados = carros.map(carro => {
    const dataBlindagem = new Date(carro.dataBlindagem);
    const dataRevisao = new Date(dataBlindagem);
    dataRevisao.setDate(dataRevisao.getDate() + 180);
    const diasRestantes = Math.ceil((dataRevisao - new Date()) / (1000 * 60 * 60 * 24));

    return {
      Placa: carro.placa,
      "Data da Blindagem": dataBlindagem.toLocaleDateString(),
      "Dias para Revisão": diasRestantes
    };
  });

  const planilha = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, planilha, "Revisões");

  XLSX.writeFile(wb, "carros_revisao.xlsx");
}
