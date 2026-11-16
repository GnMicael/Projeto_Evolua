export const resizeImage = (file: File, max = 1600): Promise<Blob> => new Promise((res, rej) => {
  if (!file.type.startsWith('image/')) return rej(new Error('Selecione uma imagem (JPG ou PNG).'))
  const url = URL.createObjectURL(file), im = new Image()
  im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); const g = c.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => (b ? res(b) : rej(new Error('Falha ao processar a imagem.'))), 'image/jpeg', 0.85) }
  im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Imagem inválida.')) }; im.src = url })
// Remove os acentos antes de trocar o resto por "_" (antes "relatório" virava "relato_rio").
export const safeName = (n: string) => n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w.\-]+/g, '_').slice(-80)
