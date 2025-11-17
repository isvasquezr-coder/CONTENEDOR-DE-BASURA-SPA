import { Injectable } from '@angular/core';

interface Point {
  x: number;
  y: number;
}

interface Node extends Point {
  g: number; // cost from start
  h: number; // heuristic cost to end
  f: number; // g + h
  parent: Node | null;
}

@Injectable({ providedIn: 'root' })
export class PathfindingService {
  private readonly GRID_WIDTH = 20;
  private readonly GRID_HEIGHT = 20;
  private obstacles: boolean[][] = [];

  constructor() {
    this.initializeGrid();
    this.defineObstacles();
  }

  private initializeGrid(): void {
    this.obstacles = Array(this.GRID_HEIGHT)
      .fill(null)
      .map(() => Array(this.GRID_WIDTH).fill(false));
  }

  private defineObstacles(): void {
    // Map building rects from map-view.component.html to grid cells
    const buildingRects = [
      { x: 5, y: 5, w: 15, h: 10 },
      { x: 25, y: 8, w: 10, h: 20 },
      { x: 40, y: 2, w: 20, h: 12 },
      { x: 65, y: 10, w: 15, h: 15 },
      { x: 85, y: 5, w: 10, h: 25 },
      { x: 5, y: 20, w: 18, h: 15 },
      { x: 30, y: 35, w: 30, h: 10 },
      { x: 65, y: 30, w: 25, h: 20 },
      { x: 10, y: 40, w: 15, h: 25 },
      { x: 40, y: 50, w: 20, h: 20 },
      { x: 70, y: 55, w: 20, h: 35 },
      { x: 5, y: 70, w: 30, h: 10 },
      { x: 45, y: 75, w: 20, h: 15 },
    ];

    buildingRects.forEach(rect => {
      const startX = Math.floor(rect.x / 5);
      const startY = Math.floor(rect.y / 5);
      const endX = Math.ceil((rect.x + rect.w) / 5);
      const endY = Math.ceil((rect.y + rect.h) / 5);
      
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          if (x >= 0 && x < this.GRID_WIDTH && y >= 0 && y < this.GRID_HEIGHT) {
            // gridX/gridY are 1-based, so obstacle grid is 0-based
            this.obstacles[y][x] = true;
          }
        }
      }
    });
  }
  
  // FIX: Updated findPath signature to align with application's data model (gridX/gridY).
  // The method now correctly handles the mapping between the external API and the internal A* algorithm's coordinate system (x/y).
  public findPath(start: { gridX: number; gridY: number }, end: { gridX: number; gridY: number }): { gridX: number; gridY: number }[] {
    const startNode: Node = { x: start.gridX, y: start.gridY, g: 0, h: 0, f: 0, parent: null };
    const endNode: Node = { x: end.gridX, y: end.gridY, g: 0, h: 0, f: 0, parent: null };

    // A* uses 0-based indexing
    const startGrid = { x: Math.round(startNode.x) - 1, y: Math.round(startNode.y) - 1 };
    const endGrid = { x: Math.round(endNode.x) - 1, y: Math.round(endNode.y) - 1 };

    const openList: Node[] = [];
    const closedList: boolean[][] = Array(this.GRID_HEIGHT).fill(null).map(() => Array(this.GRID_WIDTH).fill(false));
    
    openList.push({x: startGrid.x, y: startGrid.y, g:0, h:0, f:0, parent: null});

    while (openList.length > 0) {
      openList.sort((a, b) => a.f - b.f);
      const currentNode = openList.shift()!;
      
      closedList[currentNode.y][currentNode.x] = true;
      
      if (currentNode.x === endGrid.x && currentNode.y === endGrid.y) {
        let path: { gridX: number; gridY: number }[] = [];
        let current: Node | null = currentNode;
        while (current) {
          // Convert back to 1-based for the application
          path.unshift({ gridX: current.x + 1, gridY: current.y + 1 });
          current = current.parent;
        }
        return path;
      }
      
      const neighbors = this.getNeighbors(currentNode);
      
      for (const neighbor of neighbors) {
        if (closedList[neighbor.y][neighbor.x]) continue;
        
        const gScore = currentNode.g + 1;
        
        let existingNode = openList.find(n => n.x === neighbor.x && n.y === neighbor.y);
        
        if (!existingNode || gScore < existingNode.g) {
          if(!existingNode) {
             existingNode = neighbor;
             openList.push(existingNode);
          }
          existingNode.parent = currentNode;
          existingNode.g = gScore;
          existingNode.h = this.heuristic(existingNode, endGrid);
          existingNode.f = existingNode.g + existingNode.h;
        }
      }
    }
    
    return []; // No path found
  }

  private getNeighbors(node: Node): Node[] {
    const neighbors: Node[] = [];
    const { x, y } = node;
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // 4-directional
    
    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;
      
      if (
        newX >= 0 && newX < this.GRID_WIDTH &&
        newY >= 0 && newY < this.GRID_HEIGHT &&
        !this.obstacles[newY][newX]
      ) {
        neighbors.push({ x: newX, y: newY, g: 0, h: 0, f: 0, parent: null });
      }
    }
    return neighbors;
  }
  
  private heuristic(a: Point, b: Point): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // Manhattan distance
  }
}
