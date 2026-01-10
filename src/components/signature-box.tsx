"use client"

import React, { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'

interface SignatureBoxProps {
    onSave: (dataUrl: string) => void
}

export const SignatureBox: React.FC<SignatureBoxProps> = ({ onSave }) => {
    const sigCanvas = useRef<SignatureCanvas>(null)
    const [isEmpty, setIsEmpty] = useState(true)

    const clear = () => {
        sigCanvas.current?.clear()
        setIsEmpty(true)
        onSave("")
    }

    const handleEnd = () => {
        if (sigCanvas.current) {
            setIsEmpty(sigCanvas.current.isEmpty())
            if (!sigCanvas.current.isEmpty()) {
                onSave(sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'))
            } else {
                onSave("")
            }
        }
    }

    return (
        <div className="border border-gray-300 rounded-md p-2 bg-white">
            <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{
                    className: 'signature-canvas w-full h-40 border border-gray-200 rounded',
                }}
                onEnd={handleEnd}
            />
            <div className="flex justify-end mt-2">
                <button
                    type="button"
                    onClick={clear}
                    className="text-sm text-red-600 hover:text-red-800"
                >
                    Temizle
                </button>
            </div>
        </div>
    )
}
