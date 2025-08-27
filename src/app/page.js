"use client"

import React from 'react';
import Script from "next/script"
import Chat from "../components/Chat.jsx"






export default function page() {

  // const TrackedBuilder = trackComponent(Builder, "Builder");

  return (
    <div>

      <Script src="http://localhost:8097" strategy="beforeInteractive" />
      <Chat />


    </div>
  )
}
