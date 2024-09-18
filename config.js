(function() {
  window.config = {
    button: {
      text: 'Show Case',
      style: {
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '3px',
        cursor: 'pointer'
      }
    },
    popup: {
      style: {
        backgroundColor: '#f1f1f1',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        borderRadius: '5px',
        maxWidth: '80%',
        maxHeight: '80%',
        overflow: 'auto'
      }
    },
    copyButton: {
      text: '复制',
      style: {
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '3px',
        padding: '2px 5px',
        fontSize: '12px',
        cursor: 'pointer'
      }
    },
    toggleButton: {
      expandText: '+',
      collapseText: '-',
      style: {
        background: 'none',
        border: '1px solid #ccc',
        borderRadius: '3px',
        fontSize: '12px',
        padding: '0 3px',
        cursor: 'pointer'
      }
    },
    messages: {
      copySuccess: '复制成功',
      error: '扩展出错，请刷页面或重新加载扩展。',
      generateFailed: '生成测试用例失败，请重试。',
      copyFailed: '制失败，请重试。',
      loading: '正在生成测试用例...'
    },
    api: {
      url: 'https://api.moonshot.cn/v1/chat/completions',
      model: 'moonshot-v1-8k',
      temperature: 0.3
    },
    icon: {
      backgroundColor: '#4CAF50',
      text: '测',
      textColor: 'white'
    }
  };
  console.log('Config set on window object:', window.config);
})();