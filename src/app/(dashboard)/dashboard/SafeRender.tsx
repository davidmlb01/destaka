'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  name: string
  children: ReactNode
}

interface State {
  hasError: boolean
  errorMsg: string
}

export class SafeRender extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMsg: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-sm font-semibold text-red-400">Erro em: {this.props.name}</p>
          <p className="text-xs text-red-300 mt-1">{this.state.errorMsg}</p>
        </div>
      )
    }
    return this.props.children
  }
}
