'use client'

import { useTheme } from 'next-themes'

export default function VideoBackground() {
  const { theme, ...stuff } = useTheme()
  //console.log({ theme, stuff })
  const darkVideoSource = '/video/WatercolorEarthDarkV2.mp4'
  const lightVideoSource = '/video/WatercolorEarthV2.mp4'
  const themeVideo = theme === 'dark' ? darkVideoSource : lightVideoSource
  return (
    <video
      src={themeVideo}
      autoPlay={true}
      loop
      muted
      className="absolute -z-10 top-0 left-0 right-0 h-[1000px] w-screen object-cover"
    />
  )
}
