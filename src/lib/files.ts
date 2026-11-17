// Plano gratuito: não há Firebase Storage (exige Blaze). As fotos são reduzidas e guardadas no próprio Firestore
// como data URL (JPEG). O limite mantém cada documento bem abaixo de 1 MiB.
export const imageToDataUrl = (file: File, max = 1200, limit = 450_000): Promise<string> => new Promise((res, rej) => {
  if (!file.type.startsWith('image/')) return rej(new Error('Selecione uma imagem (JPG ou PNG).'))
  const url = URL.createObjectURL(file), im = new Image()
  im.onload = () => {
    URL.revokeObjectURL(url)
    let side = max, q = 0.8
    for (let i = 0; i < 10; i++) {
      const k = Math.min(1, side / Math.max(im.width, im.height)), c = document.createElement('canvas')
      c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k))
      const g = c.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height)
      const out = c.toDataURL('image/jpeg', q)
      if (out.length <= limit) return res(out)
      if (q > 0.55) q -= 0.1; else side = Math.round(side * 0.8)
    }
    rej(new Error('Não foi possível reduzir a imagem o bastante. Use uma foto menor.'))
  }
  im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Imagem inválida.')) }
  im.src = url
})
// Aceita só http(s): bloqueia "javascript:" e similares em links de documentos.
export const safeUrl = (u: any): string => { try { const x = new URL(String(u).trim()); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : '' } catch { return '' } }
