import React, { Suspense, useState, useEffect, useRef } from "react"
import { Interactive, XR, ARButton, createXRStore } from "@react-three/xr"
import { Billboard, Text, useGLTF } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import * as THREE from "three"
import { useThree } from "@react-three/fiber"


const store = createXRStore()
const earthRadius = 6371000 // meters

function latLonToOffset(lat0, lon0, lat, lon) {
  const dLat = (lat - lat0) * (Math.PI / 180)
  const dLon = (lon - lon0) * (Math.PI / 180)
  const x = dLon * earthRadius * Math.cos(lat0 * Math.PI / 180)
  const z = dLat * earthRadius
  return [x, 0, -z] // north forward
}

function Box({ color, size, scale, children, ...rest }) {
  return (
    <mesh scale={scale} {...rest}>
      <boxGeometry args={size} />
      <meshPhongMaterial color={color} />
      {children}
    </mesh>
  )
}

function Button(props) {
  const [hover, setHover] = useState(false)
  const [color, setColor] = useState("blue")

  const onSelect = () => {
    setColor(`#${Math.floor(Math.random() * 16777215).toString(16)}`)
  }

  return (
    <Interactive onHover={() => setHover(true)} onBlur={() => setHover(false)} onSelect={onSelect}>
      <Box
        color={color}
        scale={hover ? [0.6, 0.6, 0.6] : [0.5, 0.5, 0.5]}
        size={[0.4, 0.1, 0.1]}
        {...props}
      >
        <Suspense fallback={null}>
          <Text
            position={[0, 0, 0.06]}
            fontSize={0.05}
            color="#000"
            anchorX="center"
            anchorY="middle"
          >
            Tap Me!
          </Text>
        </Suspense>
      </Box>
    </Interactive>
  )
}

function MonkModel(props) {
  const { scene } = useGLTF("/monk_character.glb")
  return <primitive object={scene} scale={1} {...props} />
}

function useDeviceHeading() {
  const [initialHeading, setInitialHeading] = useState(null)

  useEffect(() => {
    function handleOrientation(e) {
      let compass
      if (e.webkitCompassHeading) {
        compass = e.webkitCompassHeading // iOS
      } else if (e.alpha !== null) {
        compass = 360 - e.alpha // Android
      }

      if (compass !== undefined && initialHeading === null) {
        setInitialHeading(compass)

        // ✅ remove listeners after capturing once
        window.removeEventListener("deviceorientationabsolute", handleOrientation, true)
        window.removeEventListener("deviceorientation", handleOrientation, true)
      }
    }

    window.addEventListener("deviceorientationabsolute", handleOrientation, true)
    window.addEventListener("deviceorientation", handleOrientation, true)

    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation, true)
      window.removeEventListener("deviceorientation", handleOrientation, true)
    }
  }, [initialHeading])

  return initialHeading
}

function CompassOverlay({ heading }) {
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center">
      <div className="w-24 h-24 border-2 border-white rounded-full flex items-center justify-center relative">
        <div
          className="w-2 h-10 bg-red-500 absolute bottom-1/2 origin-bottom"
          style={{ transform: `rotate(${heading || 0}deg)` }}
        />
      </div>
      <p className="text-white mt-2">
        {heading !== null ? `${heading.toFixed(1)}°` : "Calibrating…"}
      </p>
    </div>
  )
}


function AxisHelper({ size = 1 }) {
  const { scene } = useThree()

  useEffect(() => {
    const axesHelper = new THREE.AxesHelper(size)
    scene.add(axesHelper)

    return () => {
      scene.remove(axesHelper)
    }
  }, [scene, size])

  return null
}

export default function App() {
  const [origin, setOrigin] = useState(null)
  const [objects, setObjects] = useState([])
  const heading = useDeviceHeading()
  const [initialHeading, setInitialHeading] = useState(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setOrigin([latitude, longitude])
        setObjects([
          { lat: latitude + 0.00005, lon: longitude, type: "monk" },
          { lat: latitude, lon: longitude + 0.00005, type: "button" }
        ])
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    )
  }, [])

  // Capture initial heading once
  useEffect(() => {
    if (heading && initialHeading === null) {
      setInitialHeading(heading)
    }
  }, [heading, initialHeading])

  if (!origin) return <div className="text-white">Getting GPS…</div>

  return (
    <>
      <ARButton
        store={store}
        onError={(err) => {
          console.error("❌ AR Error:", err)
          alert("AR session failed: " + err.message)
        }}
      >
        {(status) => {
          if (status === "unsupported") return <span>AR Not Supported</span>
          if (status === "entered") return <span>Exit AR</span>
          return <span>Enter AR</span>
        }}
      </ARButton>

      <Canvas>
        <XR store={store} referenceSpace="local-floor">
          <ambientLight />
          <pointLight position={[1, 1, 1]} />


          {/* Apply rotation based on initial heading */}
          <group rotation={[0, -THREE.MathUtils.degToRad(initialHeading || 0), 0]}>
  
            <AxisHelper size={2} />

            {objects.map((obj, i) => {
              const [x, y, z] = latLonToOffset(origin[0], origin[1], obj.lat, obj.lon)
              return obj.type === "monk" ? (
                <group key={i} position={[x, y, z]}>
                  <Billboard scale={0.2} position={[0, 1.5, 0]}>
                    <Text>{x}, {y}, {z}</Text>
                  </Billboard>
                  <MonkModel/>
                </group>
              ) : (
                <Button key={i} position={[x, y, z]} />
              )
            })}
          </group>
        </XR>
      </Canvas>

      <CompassOverlay heading={heading} />
    </>
  )
}
