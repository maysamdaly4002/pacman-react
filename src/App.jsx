import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

const MAZE_TEMPLATE = [
  '#############',
  '#...........#',
  '#.##.###.##.#',
  '#...........#',
  '#.##.#.#.##.#',
  '#...........#',
  '###.#...#.###',
  '#...........#',
  '#.##.#.#.##.#',
  '#...........#',
  '#############',
]

const PACMAN_START = { row: 9, col: 1 }
const GHOST_STARTS = [
  { row: 1, col: 11, color: '#ff4d6d' },
  { row: 9, col: 11, color: '#4dd2ff' },
]

function buildGrid() {
  return MAZE_TEMPLATE.map((row) => row.split(''))
}

function countDots(grid) {
  return grid.reduce(
    (sum, row) => sum + row.filter((cell) => cell === '.').length,
    0
  )
}

function isWalkable(grid, row, col) {
  return (
    row >= 0 &&
    row < grid.length &&
    col >= 0 &&
    col < grid[0].length &&
    grid[row][col] !== '#'
  )
}

const DIRECTIONS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
]

function moveGhost(ghost, pacman, grid) {
  const options = DIRECTIONS.map(([dr, dc]) => ({
    row: ghost.row + dr,
    col: ghost.col + dc,
  })).filter((pos) => isWalkable(grid, pos.row, pos.col))

  if (options.length === 0) return ghost

  // 25% of the time, move randomly so ghosts aren't perfectly predictable
  if (Math.random() < 0.25) {
    const pick = options[Math.floor(Math.random() * options.length)]
    return { ...ghost, row: pick.row, col: pick.col }
  }

  // Otherwise, greedily step toward Pacman (simple chase behaviour)
  options.sort((a, b) => {
    const da = Math.abs(a.row - pacman.row) + Math.abs(a.col - pacman.col)
    const db = Math.abs(b.row - pacman.row) + Math.abs(b.col - pacman.col)
    return da - db
  })

  const best = options[0]
  return { ...ghost, row: best.row, col: best.col }
}

function App() {
  const [grid, setGrid] = useState(buildGrid)
  const [pacman, setPacman] = useState(PACMAN_START)
  const [ghosts, setGhosts] = useState(GHOST_STARTS)
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState('playing') // 'playing' | 'won' | 'lost'

  const statusRef = useRef(status)
  statusRef.current = status

  const resetGame = useCallback(() => {
    setGrid(buildGrid())
    setPacman(PACMAN_START)
    setGhosts(GHOST_STARTS)
    setScore(0)
    setStatus('playing')
  }, [])

  // Keyboard controls
  useEffect(() => {
    function handleKey(e) {
      if (statusRef.current !== 'playing') return

      const deltas = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      }
      const delta = deltas[e.key]
      if (!delta) return
      e.preventDefault()

      setPacman((prevPacman) => {
        const nextRow = prevPacman.row + delta[0]
        const nextCol = prevPacman.col + delta[1]
        if (!isWalkable(grid, nextRow, nextCol)) return prevPacman

        if (grid[nextRow][nextCol] === '.') {
          const nextGrid = grid.map((r) => [...r])
          nextGrid[nextRow][nextCol] = ' '
          setGrid(nextGrid)
          setScore((s) => s + 10)
          if (countDots(nextGrid) === 0) setStatus('won')
        }

        return { row: nextRow, col: nextCol }
      })
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [grid])

  // Ghost movement loop
  useEffect(() => {
    if (status !== 'playing') return
    const id = setInterval(() => {
      setGhosts((prev) => prev.map((g) => moveGhost(g, pacman, grid)))
    }, 550)
    return () => clearInterval(id)
  }, [pacman, grid, status])

  // Collision check (lose condition)
  useEffect(() => {
    if (status !== 'playing') return
    const caught = ghosts.some(
      (g) => g.row === pacman.row && g.col === pacman.col
    )
    if (caught) setStatus('lost')
  }, [ghosts, pacman, status])

  return (
    <div className="app">
      <header className="hud">
        <h1>PAC-REACT</h1>
        <span className="score">Score: {score}</span>
      </header>

      <div
        className="maze"
        style={{ gridTemplateColumns: `repeat(${grid[0].length}, 28px)` }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isPacman = pacman.row === r && pacman.col === c
            const ghost = ghosts.find((g) => g.row === r && g.col === c)
            let className = 'cell'
            if (cell === '#') className += ' wall'
            if (cell === '.') className += ' dot'
            return (
              <div key={`${r}-${c}`} className={className}>
                {isPacman && <div className="pacman" />}
                {ghost && (
                  <div className="ghost" style={{ background: ghost.color }} />
                )}
              </div>
            )
          })
        )}
      </div>

      {status !== 'playing' && (
        <div className="overlay">
          <p>{status === 'won' ? 'Gagné !' : 'Perdu !'}</p>
          <button onClick={resetGame}>Rejouer</button>
        </div>
      )}
    </div>
  )
}

export default App
