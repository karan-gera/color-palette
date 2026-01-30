/**
 * SVG filter definitions for Color Vision Deficiency (CVD) simulation.
 * Embedded in React for Firefox/Waterfox compatibility.
 * 
 * Filter matrices:
 * - Deuteranopia, Protanopia: Viénot 1999
 * - Tritanopia: Brettel 1997
 * - Achromatopsia: ITU-R BT.709 grayscale
 */
export default function CVDFilters() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Deuteranopia (red-green, most common ~6% males) - Viénot 1999 */}
        <filter id="cvd-deuteranopia" colorInterpolationFilters="linearRGB">
          <feColorMatrix
            type="matrix"
            values="
              0.367  0.861 -0.228  0  0
              0.280  0.673  0.047  0  0
             -0.012  0.043  0.969  0  0
              0      0      0      1  0
            "
          />
        </filter>

        {/* Protanopia (red-green ~1% males) - Viénot 1999 */}
        <filter id="cvd-protanopia" colorInterpolationFilters="linearRGB">
          <feColorMatrix
            type="matrix"
            values="
              0.152  1.053 -0.205  0  0
              0.115  0.786  0.099  0  0
             -0.004 -0.048  1.052  0  0
              0      0      0      1  0
            "
          />
        </filter>

        {/* Tritanopia (blue-yellow, rare ~0.003%) - Brettel 1997 */}
        <filter id="cvd-tritanopia" colorInterpolationFilters="linearRGB">
          <feColorMatrix
            type="matrix"
            values="
              1.256 -0.077 -0.179  0  0
             -0.078  0.931  0.148  0  0
              0.005  0.691  0.304  0  0
              0      0      0      1  0
            "
          />
        </filter>

        {/* Achromatopsia (monochromacy, rare) - ITU-R BT.709 Grayscale */}
        <filter id="cvd-achromatopsia" colorInterpolationFilters="linearRGB">
          <feColorMatrix
            type="matrix"
            values="
              0.2126  0.7152  0.0722  0  0
              0.2126  0.7152  0.0722  0  0
              0.2126  0.7152  0.0722  0  0
              0       0       0       1  0
            "
          />
        </filter>
      </defs>
    </svg>
  )
}
