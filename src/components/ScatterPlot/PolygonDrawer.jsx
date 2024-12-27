/* eslint-disable react/prop-types */
import React, { useState, useRef } from 'react';
import pointInPolygon from '../../utils/polygonUtils';
import ScatterPlot from './ScatterPlot';
import options from '../../utils/utils';

function PolygonDrawer({ drawing, setDrawing }) {
  const [polygons, setPolygons] = useState([]);
  const [currentPolygonPoints, setCurrentPolygonPoints] = useState([]);
  const svgRef = useRef(null);
  const startPoint = useRef(null);
  const chartRef = useRef(null);
  const [data, setData] = useState([]);

  const isCloseToStart = (point) => {
    if (!startPoint.current) return false;
    const distance = Math.sqrt(
      (point.x - startPoint.current.x) ** 2 + (point.y - startPoint.current.y) ** 2,
    );
    return distance < 20;
  };

  const handleMouseDown = (e) => {
    if (!chartRef.current || !drawing) return;

    const { chartArea } = chartRef.current;
    const { canvas } = chartRef.current;

    if (!chartArea || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - chartArea.left;
    const y = e.clientY - rect.top - chartArea.top;

    const newPoint = { x, y };

    if (currentPolygonPoints.length > 2 && isCloseToStart(newPoint)) {
      setPolygons([
        ...polygons,
        {
          points: [...currentPolygonPoints, currentPolygonPoints[0]],
          label: 'New Polygon',
          color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        },
      ]);
      setCurrentPolygonPoints([]);
      startPoint.current = null;
      setDrawing(false);
    } else {
      setCurrentPolygonPoints([...currentPolygonPoints, newPoint]);
      if (currentPolygonPoints.length === 0) {
        startPoint.current = newPoint;
      }
    }
  };

  const getChartPoint = (point) => {
    const chart = chartRef.current;
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    return [xScale.getValueForPixel(point.x), yScale.getValueForPixel(point.y)];
  };

  const getPixelPoint = (dataPoint) => {
    const chart = chartRef.current;
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    return { x: xScale.getPixelForValue(dataPoint.x), y: yScale.getPixelForValue(dataPoint.y) };
  };

  const currentPoint = currentPolygonPoints.map((p) =>
    getPixelPoint({
      x:
        options.scales.x.min +
        ((options.scales.x.max - options.scales.x.min) * p.x) / chartRef.current.chartArea.width,
      y:
        options.scales.y.max -
        ((options.scales.y.max - options.scales.y.min) * p.y) / chartRef.current.chartArea.height,
    }),
  );

  return (
    <div style={{ position: 'relative', width: '800px', height: '600px' }}>
      <ScatterPlot ref={chartRef} data={data} setData={setData} options={options} />
      <svg
        ref={svgRef}
        width='100%'
        height='100%'
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
        onMouseDown={handleMouseDown}
      >
        {polygons.map((polygon) => {
          const pixelPoints = polygon.points.map((p) =>
            getPixelPoint({
              x:
                options.scales.x.min +
                ((options.scales.x.max - options.scales.x.min) * p.x) /
                  chartRef.current.chartArea.width,
              y:
                options.scales.y.max -
                ((options.scales.y.max - options.scales.y.min) * p.y) /
                  chartRef.current.chartArea.height,
            }),
          );

          const chartPolygon = pixelPoints.map((p) => getChartPoint(p));

          const selectedPointsSet = new Set();
          // eslint-disable-next-line react/prop-types
          data.forEach((dataPoint) => {
            if (pointInPolygon([dataPoint['CD45-KrO'], dataPoint['SS INT LIN']], chartPolygon)) {
              selectedPointsSet.add(JSON.stringify(dataPoint));
            }
          });
          const selectedPoints = Array.from(selectedPointsSet).map(JSON.parse);
          const polygonPath = pixelPoints.map((p) => `${p.x},${p.y}`).join(' ');

          return (
            <g key={polygonPath}>
              <polygon
                points={polygonPath}
                fill={polygon.color}
                stroke='black'
                strokeWidth={2}
                opacity={0.5}
              />
              <text x={pixelPoints[0].x + 10} y={pixelPoints[0].y - 10} fill='black'>
                {polygon.label} ({selectedPoints.length})
              </text>
            </g>
          );
        })}
        {currentPolygonPoints.length > 0 && (
          <polygon
            points={currentPoint.map((p) => `${p.x},${p.y}`).join(' ')}
            fill='rgba(0, 0, 255, 0.3)'
            stroke='blue'
          />
        )}
      </svg>
    </div>
  );
}

export default PolygonDrawer;