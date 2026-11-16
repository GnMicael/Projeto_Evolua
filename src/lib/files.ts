export const resizeImage = (file: File, max = 1600): Promise<Blob> => new Promise((res, rej) => {
  if (!file.type.startsWith('image/')) return rej(new Error('Selecione uma imagem (JPG ou PNG).'))
  const url = URL.createObjectURL(file), im = new Image()
  im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => (b ? res(b) : rej(new Error('Falha ao processar a imagem.'))), 'image/jpeg', 0.85) }
  im.onerror = () => rej(new Error('Imagem inválida.')); im.src = url })
export const safeName = (n: string) => n.normalize('NFD').replace(/[^\w.\-]+/g, '_').slice(-80)
