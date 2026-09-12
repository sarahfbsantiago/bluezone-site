type Props = { src?: string; title?: string }

/** Quadro de vídeo 16:9 em vidro. Sem `src`, mostra um placeholder com play em pontilhismo. */
export function VideoFrame({ src = '', title = 'Vídeo da Bluezone' }: Props) {
  return (
    <div className="video-frame">
      {src ? (
        <iframe className="video-embed" src={src} title={title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      ) : (
        <div className="video-placeholder" role="img" aria-label="Espaço reservado para o vídeo">
          <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
            <defs>
              <pattern id="video-dots" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                <circle cx="1.2" cy="1.2" r=".78" fill="#fff" />
              </pattern>
              <linearGradient id="video-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#1f6dff" />
                <stop offset=".55" stopColor="#14b39a" />
                <stop offset="1" stopColor="#3ccf6f" />
              </linearGradient>
              <mask id="video-mask">
                <rect width="64" height="64" fill="#000" />
                <circle cx="32" cy="32" r="30" fill="url(#video-dots)" />
                <path d="M26 20l18 12-18 12z" fill="#000" />
              </mask>
            </defs>
            <rect width="64" height="64" fill="url(#video-grad)" mask="url(#video-mask)" />
            <path d="M26 20l18 12-18 12z" fill="#17324e" opacity=".85" />
          </svg>
          <span className="video-label">vídeo em breve</span>
        </div>
      )}
    </div>
  )
}
