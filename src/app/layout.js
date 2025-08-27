'use client'

import React from 'react';
import "./globals.css";
import ContextProvider from "../components/Context";
import Script from 'next/script';


export default function RootLayout({ children }) {
  return (
    <html lang="en">




      <body

      >

        <ContextProvider>

          <main>

            {children}
          </main>

        </ContextProvider>

      </body>
    </html>
  );
}
