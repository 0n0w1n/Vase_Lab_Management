// components/YouTubePlayer.tsx
type Props = { id: string; title?: string };

export function Surprise(){
    return (<YouTubePlayer id="dQw4w9WgXcQ"/>);
}

export default function YouTubePlayer({ id, title = "YouTube video" }: Props) {
  const params = new URLSearchParams({
    autoplay: "1",    // start right away
    mute: "1",        // required for autoplay to work
    playsinline: "1", // play inline on iPhone instead of going fullscreen
    loop: "1",
    playlist: id,     // loop only works if playlist is set to the same id
    rel: "0",         // suggested videos come from the same channel only
  });

  return (
    <div style={{ width: "500px", aspectRatio: "16 / 9" }}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?${params}`}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        style={{ width: "100%", height: "100%", border: 0 }}
      />
    </div>
  );
}