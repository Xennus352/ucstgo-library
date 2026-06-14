import * as React from "react"
export function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(false)
  React.useEffect(() => {
    const matchMedia = window.matchMedia(query)
    const handleChange = () => setValue(matchMedia.matches)
    matchMedia.addEventListener("change", handleChange)
    setValue(matchMedia.matches)
    return () => matchMedia.removeEventListener("change", handleChange)
  }, [query])
  return value
}