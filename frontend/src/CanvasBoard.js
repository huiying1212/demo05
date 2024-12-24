// CanvasBoard.js
import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose'; // fCoSE图布局算法

cytoscape.use(fcose); 

function CanvasBoard({ graphData }) {
  const cyRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!graphData) {
      return;
    }
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // 初始化Cytoscape
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: transformDataToElements(graphData),
      style: [
        {
          selector: 'node.keyword-node',
          style: {
            'label': 'data(keyword)',
            'text-wrap': 'wrap', // 允许文本在达到最大宽度时自动换行
            'text-max-width': '150px',
            'text-valign': 'top',
            'text-halign': 'center',
            'font-weight': 'bold',
            'grabbable': true, // dragging
          },
        },
        {
          selector: 'node.detail-node',
          style: {
            'background-color': '#DCDCDC',
            'background-image': 'data(image)',
            'background-fit': 'contain', // 图片保持原始比例
            'background-clip': 'none',
            'width': 'data(size)',
            'height': 'data(size)',
            'text-wrap': 'wrap',
            'text-max-width': '150px',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'label': 'data(details)', 
            'font-size': '15px',
            'text-margin-y': '15px', 
            'grabbable': true, 
            // 'shape': 'roundrectangle',
            'padding': '20px', 
          },
        },
        {
          selector: 'edge',
          style: {
            'label': 'data(label)',
            'text-rotation': 'autorotate',
            'font-weight': 'bold',
            'font-size': '15px',
            'text-margin-x': '0px',
            'text-margin-y': '-10px',
            'width': 10,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'color': 'gray', 
            'source-endpoint': 'outside-to-node',
            'target-endpoint': 'outside-to-node',
            'arrow-scale': 1.2,
          },
        },
      ],
      layout: {
        name: 'fcose',
        quality: 'default',
        randomize: false, // 数据不变时布局不变
        animate: true, 
        animationDuration: 1000, 
        fit: true,
        padding: 30,
        nodeSeparation: 300, // 节点间距
        nodeDimensionsIncludeLabels: true,
        uniformNodeDimensions: false,
        packComponents: true,
        step: 'all',
      },
    });

    cyRef.current.userZoomingEnabled(true); // 启用缩放
    cyRef.current.userPanningEnabled(true); // 启用平移

  }, [graphData]);

  if (!graphData) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div className="welcome-text" style={welcomeTextStyle}>
          W E L C O M E
        </div>
      </div>
    );
  }

  return (
    <div
      id="cy"
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    />
  );
}

const welcomeTextStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontSize: '48px',
  color: '#ffffff',
  fontWeight: 'bold',
  textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
};

function transformDataToElements(graphData) {
  const nodes = graphData?.keyinfo || [];
  const edges = graphData?.connections || [];
  const elements = [];
  const degreeMap = {};

  nodes.forEach((node) => {
    degreeMap[node.id] = 0;
  });

  edges.forEach((edge) => {
    degreeMap[edge.from] = (degreeMap[edge.from] || 0) + 1; 
    degreeMap[edge.to] = (degreeMap[edge.to] || 0) + 1;     
    elements.push({
      data: {
        id: `${edge.from}-${edge.to}`,
        source: edge.from, 
        target: edge.to,
        label: edge.relationship,
      },
    });
  });

  const degrees = Object.values(degreeMap);
  const maxDegree = Math.max(...degrees);
  const minDegree = Math.min(...degrees);

  // 根据度设置节点大小
  nodes.forEach((node) => {
    const degree = degreeMap[node.id];
    const hasImage = node.image && node.image.trim() !== "";
    const size = hasImage 
      ? 100 + ((degreeMap[node.id] - minDegree) / (maxDegree - minDegree || 1)) * 100 
      : 1; // 如果没有图片节点大小设置为1

    // 父节点
    elements.push({
      data: {
        id: node.id, 
        keyword: node.keyword,
      },
      classes: 'keyword-node', 
    });

    // 子节点
    elements.push({
      data: {
        id: `${node.id}-child`,
        parent: node.id, 
        image: `/images/${node.image}`,
        degree: degree,
        size: size,
        details: `${node.description}\n${node.otherinfo}`,
      },
      classes: 'detail-node', 
    });
  });

  return elements;
}

export default CanvasBoard;
