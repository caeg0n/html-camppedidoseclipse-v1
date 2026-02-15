window.MENU_DATA = [
  {
    id: "pizzass",
    title: "Pizzas",
    note: "Tamanhos e valores do cardápio original.",
    groups: [
      {
        title: "Tamanhos",
        items: [
          { name: "Broto (individual)", price: "R$ 25,00" },
          { name: "Pequena (4 pedaços)", price: "R$ 45,00" },
          { name: "Média (5 pedaços)", price: "R$ 60,00" },
          { name: "Grande (8 pedaços)", price: "R$ 70,00" },
          { name: "Família (12 pedaços)", price: "R$ 85,00" }
        ]
      },
      {
        title: "Sabores",
        note: "Escolha o tamanho e combine com o sabor desejado.",
        items: [
          {
            name: "Calabresa",
            desc: "Calabresa, milho, azeitona, orégano, tomate e mussarela."
          },
          {
            name: "Bacon",
            desc: "Bacon, mussarela, orégano, azeitona e tomate."
          },
          {
            name: "Frango",
            desc: "Frango, mussarela, orégano, azeitona e tomate."
          },
          {
            name: "Moda",
            desc: "Bacon, calabresa, frango, mussarela, azeitona, tomate, orégano, catupiry e palmito."
          },
          {
            name: "Portuguesa",
            desc: "Mussarela, calabresa, ovo, palmito, milho, azeitona, cebola, ervilha, orégano, tomate e bacon."
          },
          {
            name: "Presunto",
            desc: "Presunto, azeitona, orégano, tomate e mussarela."
          },
          {
            name: "Calabresa Especial",
            desc: "Calabresa, milho, azeitona, orégano, tomate, cebola e mussarela."
          },
          {
            name: "Frango com Catupiry",
            desc: "Frango, orégano, azeitona, catupiry, mussarela e tomate."
          },
          {
            name: "Palmito",
            desc: "Palmito, azeitona, orégano, tomate e mussarela."
          },
          {
            name: "Legumes",
            desc: "Mussarela, ervilha, milho, azeitona, orégano, tomate e palmito."
          }
        ]
      }
    ]
  },
  {
    id: "sanduiches",
    title: "Sanduíches",
    sortByPrice: true,
    items: [
      {
        name: "X-Salada",
        price: "R$ 18",
        desc: "Pão de hambúrguer, hambúrguer, presunto, queijo, alface, tomate, abacaxi, milho e batata." // [cite: 4, 7, 8]
      },
      {
        name: "X-Salada Especial",
        price: "R$ 20",
        desc: "Pão de hambúrguer, hambúrguer, presunto, queijo, alface, tomate, abacaxi, milho, batata e ovo." // [cite: 15, 17, 18]
      },
      {
        name: "X-Calabresa",
        price: "R$ 23",
        desc: "Pão de hambúrguer, calabresa, presunto, queijo, alface, tomate, abacaxi, milho e batata." // [cite: 21, 22, 23]
      },
      {
        name: "X-Calabresa Especial",
        price: "R$ 25",
        desc: "Pão de hambúrguer, calabresa, presunto, queijo, alface, tomate, abacaxi, milho, batata e ovo." // [cite: 25, 26, 27]
      },
      {
        name: "X-Bacon",
        price: "R$ 23",
        desc: "Pão de hambúrguer, hambúrguer, bacon, presunto, queijo, milho, alface e batata." // [cite: 31, 32, 33, 35]
      },
      {
        name: "X-Bacon Especial",
        price: "R$ 25",
        desc: "Pão de hambúrguer, hambúrguer, bacon, presunto, queijo, milho, alface, batata e ovo." // [cite: 47]
      },
      {
        name: "X-Frango",
        price: "R$ 25",
        desc: "Pão de hambúrguer, filé de frango, ovo, presunto, queijo, alface, tomate, abacaxi, milho e batata." // [cite: 51]
      },
      {
        name: "X-Tudo",
        price: "R$ 28",
        desc: "Pão de hambúrguer, hambúrguer, bacon, presunto, queijo, calabresa, salsicha, frango, alface, tomate, milho, batata e ovo." // [cite: 69]
      },
      {
        name: "X-Gulosão (maior da casa)",
        price: "R$ 35",
        desc: "Pão de hambúrguer, 2 hambúrgueres, bacon, presunto, queijo, salsicha, calabresa, 2 ovos, filé de frango, alface, tomate, abacaxi, milho, batata e ovo." // [cite: 48]
      },
      {
        name: "Cachorro Quente",
        price: "R$ 12",
        desc: "Salsicha, molho, mussarela, milho e batata palha." // [cite: 72]
      },
      {
        name: "Cachorro Quente Duplo",
        price: "R$ 15",
        desc: "Duas salsichas, molho, milho e batata palha." // [cite: 74]
      }
    ]
  },
  {
    id: "caldos",
    title: "Caldos",
    note: "Acompanha torrada, mussarela e cebolinha verde.", // [cite: 78, 79]
    items: [
      { name: "Costela 500ml", price: "R$ 18" }, // [cite: 77]
      { name: "Frango 500ml", price: "R$ 18" } // [cite: 77]
    ]
  },
  {
    id: "espetinhos",
    title: "Espetinhos",
    sortByPrice: true,
    items: [
      {
        name: "Jantinha",
        price: "R$ 30",
        desc: "1 porção de arroz, 1 porção de feijão, 1 porção de vinagrete, 1 porção de mandioca, + 1 espeto à escolha" // [cite: 104]
      },
      {
        name: "Meia Jantinha",
        price: "R$ 22",
        desc: "½ porção de arroz, ½ porção de feijão, ½ porção de vinagrete, ½ porção de mandioca, + 1 espeto à escolha" // [cite: 106]
      },
      {
        name: "Espetinhos individuais",
        price: "R$ 14",
        desc: "Consultar variedades disponíveis com o garçom" // [cite: 96, 97, 98]
      }
    ]
  },
  {
    id: "pasteis",
    title: "Pastéis",
    items: [
      { name: "Carne", price: "R$ 13" }, // [cite: 108]
      { name: "Carne com Queijo", price: "R$ 16" }, // [cite: 108]
      { name: "Frango", price: "R$ 13" }, // [cite: 108]
      { name: "Frango com Catupiry", price: "R$ 16" }, // [cite: 108]
      { name: "Presunto e Queijo", price: "R$ 13" }, // [cite: 108]
      { name: "Mega (mix de sabores)", price: "R$ 20" }, // [cite: 111]
      { name: "Pizza", price: "R$ 18" } // [cite: 108]
    ]
  },
  {
    id: "porcoes",
    title: "Porções",
    sortByPrice: true,
    note: "Porções completas acompanham: 1 porção de arroz, 1 porção de feijão tropeiro, 1 porção de vinagrete, 1 porção de batata frita.", // [cite: 87, 89, 94]
    items: [
      { name: "Picanha Completa 650g", price: "R$ 140" }, // [cite: 85]
      { name: "Picanha Completa 450g", price: "R$ 105" }, // [cite: 88]
      { name: "Picanha Simples 650g", price: "R$ 115" }, // [cite: 93]
      { name: "Picanha Simples 450g", price: "R$ 95" }, // [cite: 80]
      { name: "Filé na Chapa 450g", price: "R$ 105" }, // [cite: 81]
      { name: "Frango a Passarinho 850g", price: "R$ 45" }, // [cite: 109]
      { name: "Filé Mignon 450g", price: "R$ 65" }, // [cite: 109]
      { name: "Filé de Tilápia 450g", price: "R$ 80" }, // [cite: 109]
      { name: "Torresmo", price: "R$ 30" }, // [cite: 109]
      { name: "Calabresa", price: "R$ 30" }, // [cite: 109]
      { name: "Batata P Simples", price: "R$ 20" }, // [cite: 109]
      { name: "Batata P Especial Queijo e Bacon", price: "R$ 25" }, // [cite: 109]
      { name: "Batata G Simples", price: "R$ 30" }, // [cite: 109]
      { name: "Batata G Especial Queijo e Bacon", price: "R$ 35" }, // [cite: 109]
      { name: "Arroz P", price: "R$ 8" }, // [cite: 109]
      { name: "Arroz G", price: "R$ 16" }, // [cite: 109]
      { name: "Feijão Tropeiro P", price: "R$ 8" }, // [cite: 109]
      { name: "Feijão Tropeiro G", price: "R$ 16" }, // [cite: 109]
      { name: "Vinagrete P", price: "R$ 8" }, // [cite: 109]
      { name: "Vinagrete G", price: "R$ 16" }, // [cite: 109]
      { name: "Mandioca", price: "R$ 30" } // [cite: 99, 101]
    ]
  },
  {
    id: "sucos",
    title: "Sucos",
    items: [
      {
        name: "Copo 500ml",
        price: "R$ 13", // [cite: 128]
        desc: "Laranja (natural), Maracujá (polpa), Acerola (polpa)" // [cite: 131]
      },
      {
        name: "Jarra 1L",
        price: "R$ 24", // [cite: 130]
        desc: "Laranja (natural), Maracujá (polpa), Acerola (polpa)" // [cite: 131]
      }
    ]
  },
  {
    id: "drinks",
    title: "Drinks / Doses",
    note: "Consultar garçom para opções de bebidas e valores.", // [cite: 124, 126]
    items: [
      { name: "Cozumel", price: "R$ 5" }, // [cite: 114]
      { name: "CDB", price: "R$ 5" }, // [cite: 116]
      { name: "Copo Especial", price: "R$ 2" }, // [cite: 118]
      { name: "Caipirinha", price: "R$ 15" }, // [cite: 120]
      { name: "Garibaldi", price: "R$ 20", desc: "Campari e suco de laranja fresco" }, // [cite: 121]
      { name: "Farmácia da Eclipse", price: "Consultar garçom" }, // [cite: 122]
      { name: "Cascata", price: "Consultar garçom" }, // [cite: 123]
      { name: "Roleta", price: "Consultar garçom" } // [cite: 125]
    ]
  }
];
