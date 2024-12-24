// App.js
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import CanvasBoard from './CanvasBoard';
import axios from 'axios';
import mockData2 from './mockData2.json';

function App() {
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    // 使用本地数据直接渲染
    const { keyinfo, connections } = mockData2;
    if (keyinfo && connections) {
      setGraphData({ keyinfo, connections });
    }
  }, []); // 空依赖数组，只在组件挂载时执行一次


// function App() {
//   const [graphData, setGraphData] = useState(null);
//   const hasFetchedRef = useRef(false); // 创建一个ref来跟踪请求是否已发送

//   useEffect(() => {
//     if (hasFetchedRef.current) {
//       // 如果已经发送过请求，则不再发送
//       return;
//     }

//     hasFetchedRef.current = true; 

//     // 应用启动后自动请求后端数据
//     axios.post('http://localhost:5000/chat', {})
//       .then(res => {
//         // 提取后端返回的数据
//         console.log('Backend response:', res.data);
//         const { data } = res.data;
//         const { keyinfo, connections } = data;
//         // 更新图形数据
//         if (keyinfo && connections) {
//           setGraphData({ keyinfo, connections });
//         }
//       })
//       .catch(error => {
//         console.error('Error fetching data:', error);
//       });
//   }, []); // 依赖数组为空，只在组件挂载时执行一次

  return (
    <div className="App">
      <div className="main-container">
        {/* Cytoscape Board */}
        <div className="left-board">
          <CanvasBoard graphData={graphData} />
        </div>
      </div>
    </div>
  );
}

export default App;
