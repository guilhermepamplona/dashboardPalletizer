# CellManager e caixas dinâmicas

Esta versão adiciona um `CellManager` para tirar a montagem da célula de dentro do `app.js`.

## Arquivos principais

- `frontend/js/cell/CellManager.js`
  - Carrega o layout fixo (`cell_layout.glb`)
  - Carrega os modelos de caixa
  - Cria as caixas configuradas em `BOX_INSTANCES`
  - Atualiza as caixas conforme os sensores do CLP

- `frontend/js/cell/Box_Loader.js`
  - Carrega todos os modelos listados em `BOX_MODELS`
  - Usa `clone(true)` para criar várias caixas usando um único GLB por tipo
  - Controla visibilidade por sensor
  - Já possui métodos para anexar caixa ao TCP e depositar no pallet

- `frontend/js/config.js`
  - `BOX_MODELS`: lista dos arquivos GLB de caixa
  - `BOX_TYPE`: nomes lógicos dos tipos de caixa
  - `BOX_INSTANCES`: caixas existentes na cena, com posição e sensor associado

## Onde ajustar posições das caixas

Ajuste no `frontend/js/config.js`, dentro de `BOX_INSTANCES`:

```js
{
  id: "Caixa_Conv1_01",
  type: BOX_TYPE.SPGV2,
  sensor: "sensor1_conv1",
  position: { x: 1.32, y: 2.8, z: 1.25 },
  rotation: { x: 0, y: 0, z: 0 },
}
```

## Esteiras clonadas no futuro

Hoje o layout ainda usa `cell_layout.glb` com todas as esteiras. Quando você separar os modelos, o caminho recomendado é:

- `cell_static.glb`: piso, pedestal, estruturas fixas
- `conveyor_product.glb`: uma esteira de produto
- `conveyor_pallet.glb`: uma esteira de pallet

Depois criamos um `ConveyorManager` parecido com o `BoxLoader`, usando `clone(true)` para criar as 4 esteiras de produto e as 4 de pallet.
