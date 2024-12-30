// CanvasBoard.js
import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose'; // fCoSE图布局算法

cytoscape.use(fcose);

function CanvasBoard({ graphData }) {
  const cyRef = useRef(null);
  const containerRef = useRef(null);

  // 用来存放所有定时器或动画帧的 ID
  const animationIntervals = useRef([]);

  useEffect(() => {
    if (!graphData) return;

    // 如果已有实例, 先销毁
    if (cyRef.current) {
      clearAllIntervals();
      cyRef.current.destroy();
    }

    // 创建 Cytoscape 实例，一次性加载所有元素
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: transformDataToElements(graphData),
      style: [
        {
          selector: 'node.keyword-node',
          style: {
            label: 'data(keyword)',
            'text-wrap': 'wrap',
            'text-max-width': '500px',
            'text-valign': 'top',
            'text-halign': 'center',
            'font-weight': 'bold',
          },
        },
        {
          selector: 'node.detail-node',
          style: {
            'background-color': '#DCDCDC',
            'background-image': 'data(image)',
            'background-fit': 'contain',
            'background-clip': 'none',
            width: 'data(size)',
            height: 'data(size)',
            'text-wrap': 'wrap',
            'text-max-width': '500px',
            'text-valign': 'bottom',
            'text-halign': 'center',
            label: 'data(details)',
            'font-size': '15px',
            'text-margin-y': '15px',
            padding: '20px',
          },
        },
        {
          selector: 'edge',
          style: {
            label: 'data(label)',
            'text-rotation': 'autorotate',
            'font-weight': 'bold',
            'font-size': '15px',
            'text-margin-y': '-10px',
            width: 10,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            color: 'gray',
            'source-endpoint': 'outside-to-node',
            'target-endpoint': 'outside-to-node',
            'arrow-scale': 1.2,
          },
        },
        // 隐藏节点和边的类
        {
          selector: '.hidden',
          style: {
            visibility: 'hidden',
            opacity: 0,
          },
        },
      ],
      layout: {
        name: 'fcose',
        quality: 'default',
        // randomize: false, // 数据不变时布局不变
        quality: 'proof',
        animate: true,
        animationDuration: 1000,
        fit: true,
        padding: 50,
        nodeSeparation: 300,
        nodeDimensionsIncludeLabels: true,
        uniformNodeDimensions: false,
        idealEdgeLength: 150,
        nodeRepulsion: 20000,
        componentSpacing: 200,
        packComponents: true,
        step: 'all',
      },
    });

    // 启用缩放、平移
    cyRef.current.userZoomingEnabled(true);
    cyRef.current.userPanningEnabled(true);

    // 把所有节点、所有边都设为 .hidden，
    cyRef.current.nodes().addClass('hidden');
    cyRef.current.edges().addClass('hidden');

    // 布局结束后，逐个显现节点
    cyRef.current.on('layoutstop', () => {
      revealNodesOneByOne(() => {
        // 当节点全部显示完，再显示所有边
        showAllEdges();

        // 最后再启动随机飘动
        startRandomFloating();
      });
    });

    return () => {
      clearAllIntervals();
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [graphData]);

  // 依次显现节点
  const revealNodesOneByOne = (onComplete) => {
    const cy = cyRef.current;
    if (!cy) return;

    const allNodes = cy.nodes();
    // 如果没有节点
    if (allNodes.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    let index = 0;

    // 第一个节点不显现
    const firstNode = allNodes[index];
    firstNode.removeClass('hidden');

    // 父节点子节点同时显现
    if (firstNode.hasClass('keyword-node')) {
      const childNode = cy.$(`#${firstNode.id()}-child`);
      childNode.removeClass('hidden');
    }

    index++;

    // 如果只有一个节点，则直接结束
    if (index >= allNodes.length) {
      if (onComplete) onComplete();
      return;
    }

    // 每隔 800ms 显示一个后续节点（父/子都在 allNodes 数组里）
    const revealInterval = setInterval(() => {
      if (index >= allNodes.length) {
        clearInterval(revealInterval);
        if (onComplete) onComplete();
        return;
      }

      // 拿到当前节点
      const node = allNodes[index];
      node.removeClass('hidden');

      // 父节点子节点同时显现
      if (node.hasClass('keyword-node')) {
        const childNode = cy.$(`#${node.id()}-child`);
        childNode.removeClass('hidden');
      }

      index++;
    }, 800);
  };

  // 一次性让所有边出现
  const showAllEdges = () => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.edges().removeClass('hidden');
  };

  // 随机飘动
  const startRandomFloating = () => {
    const cy = cyRef.current;
    if (!cy) return;

    // 给每个节点设置随机运动参数
    cy.nodes().forEach((node) => {
      const initPos = { ...node.position() };
      node._floatParams = {
        originX: initPos.x,
        originY: initPos.y,
        angleX: Math.random() * 2 * Math.PI,
        angleY: Math.random() * 2 * Math.PI,
        speedX: 0.03 + Math.random() * 0.02,
        speedY: 0.03 + Math.random() * 0.02,
        amplitudeX: 5 + Math.random() * 10,
        amplitudeY: 5 + Math.random() * 10,
      };
    });

    // setInterval周期性更新
    const intervalId = setInterval(() => {
      cy.nodes().forEach((node) => {
        const p = node._floatParams;
        if (!p) return;
        p.angleX += p.speedX;
        p.angleY += p.speedY;
        const newX = p.originX + p.amplitudeX * Math.sin(p.angleX);
        const newY = p.originY + p.amplitudeY * Math.cos(p.angleY);
        node.position({ x: newX, y: newY });
      });
    }, 60);

    animationIntervals.current.push(intervalId);
  };

  const clearAllIntervals = () => {
    animationIntervals.current.forEach((id) => clearInterval(id));
    animationIntervals.current = [];
  };

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
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
};

// 数据转换
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

  nodes.forEach((node) => {
    const degree = degreeMap[node.id];
    const hasImage = node.image && node.image.trim() !== '';
    const size = hasImage
      ? 100 + ((degree - minDegree) / (maxDegree - minDegree || 1)) * 100
      : 1;

    elements.push({
      data: {
        id: node.id,
        keyword: node.keyword,
      },
      classes: 'keyword-node',
    });

    elements.push({
      data: {
        id: `${node.id}-child`,
        parent: node.id,
        image: `/images/${node.image}`,
        degree: degree,
        size: size,
        details: node.description,
      },
      classes: 'detail-node',
    });
  });

  return elements;
}

export default CanvasBoard;
