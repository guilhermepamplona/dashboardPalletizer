export function prepareMesh(obj) {
  obj.traverse((child) => {
    if (!child.isMesh) return;

    child.castShadow = false;
    child.receiveShadow = false;

    if (child.material) {
      child.material.roughness = child.material.roughness ?? 0.55;
      child.material.metalness = child.material.metalness ?? 0.25;
    }
  });
}

export function getRequiredObject(root, name) {
  const obj = root.getObjectByName(name);

  if (!obj) {
    console.warn(`Objeto '${name}' não encontrado no GLB.`);
  }

  return obj;
}
