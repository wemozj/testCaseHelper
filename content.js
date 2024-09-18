(function() {
    console.log('Content script loaded');
    let button = null;
    let popup = null;
    let config = null;

    // 加载配置
    function loadConfig() {
      return new Promise((resolve, reject) => {
        console.log('Loading config...');
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('config.js');
        script.onload = function() {
          console.log('Config script loaded');
          // 给一些时间让 config.js 执行
          setTimeout(() => {
            if (window.config) {
              console.log('Config loaded successfully:', window.config);
              resolve(window.config);
            } else {
              console.error('Config not found in window object');
              console.log('window object:', window);
              reject(new Error('Config not found'));
            }
          }, 100);
        };
        script.onerror = (error) => {
          console.error('Error loading config:', error);
          reject(error);
        };
        (document.head || document.documentElement).appendChild(script);
      });
    }

    // 初始化函数
    async function initialize() {
      console.log('Initializing content script');
      try {
        config = await loadConfig();
        console.log('Config loaded:', config);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);
        console.log('Event listeners added');
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    }

    // 创建按钮
    function createButton() {
      console.log('Creating button with config:', config.button);
      const newButton = document.createElement('button');
      newButton.textContent = config.button.text;
      newButton.style.position = 'absolute';
      newButton.style.zIndex = '9999';
      newButton.style.display = 'none';
      Object.assign(newButton.style, config.button.style);
      newButton.addEventListener('click', handleButtonClick);
      document.body.appendChild(newButton);
      console.log('Button created:', newButton);
      return newButton;
    }

    // 显示按钮
    function showButton(event) {
      console.log('Showing button');
      if (!button) {
        button = createButton();
      }
      
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      button.style.left = `${event.pageX}px`;
      button.style.top = `${rect.bottom + window.scrollY}px`;
      button.style.display = 'block';
      console.log('Button displayed at:', button.style.left, button.style.top);
    }

    // 移除按钮
    function removeButton() {
      console.log('Removing button');
      if (button) {
        document.body.removeChild(button);
        button = null;
      }
    }

    // 处理按钮点击
    function handleButtonClick(event) {
      event.stopPropagation();
      const selectedText = window.getSelection().toString().trim();
      removeButton();
      window.getSelection().removeAllRanges();

      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        console.error('Chrome runtime not available');
        showErrorMessage(config.messages.error);
        return;
      }

      showLoadingAnimation();

      try {
        chrome.runtime.sendMessage({action: "generateTestCase", text: selectedText}, handleResponse);
      } catch (error) {
        hideLoadingAnimation();
        console.error('Error sending message:', error);
        showErrorMessage(config.messages.error);
      }
    }

    // 处理响应
    function handleResponse(response) {
      hideLoadingAnimation();
      if (chrome.runtime.lastError) {
        console.error('Chrome runtime error:', chrome.runtime.lastError);
        showErrorMessage(config.messages.error);
        return;
      }
      if (response && response.testCase) {
        showPopup(response.testCase);
      } else {
        console.error('Failed to generate test case');
        showErrorMessage(config.messages.generateFailed);
      }
    }

    // 显示加载动画
    function showLoadingAnimation() {
      const loadingEl = document.createElement('div');
      loadingEl.id = 'testcase-loading';
      loadingEl.style.position = 'fixed';
      loadingEl.style.top = '50%';
      loadingEl.style.left = '50%';
      loadingEl.style.transform = 'translate(-50%, -50%)';
      loadingEl.style.padding = '20px';
      loadingEl.style.background = 'rgba(0, 0, 0, 0.7)';
      loadingEl.style.color = 'white';
      loadingEl.style.borderRadius = '10px';
      loadingEl.style.zIndex = '10000';
      loadingEl.innerHTML = `${config.messages.loading}<br><div class="spinner"></div>`;

      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 10px auto 0;
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(loadingEl);
    }

    // 隐藏加载动画
    function hideLoadingAnimation() {
      const loadingEl = document.getElementById('testcase-loading');
      if (loadingEl) {
        document.body.removeChild(loadingEl);
      }
    }

    // 显示弹窗
    function showPopup(testCase) {
      // 首先移除任何现有的弹窗
      closePopup();
      
      popup = document.createElement('div');
      popup.style.position = 'fixed';
      popup.style.zIndex = '10000';
      popup.style.left = '50%';
      popup.style.top = '50%';
      popup.style.transform = 'translate(-50%, -50%)';
      popup.style.padding = '20px';
      popup.style.backgroundColor = 'white';
      popup.style.border = '1px solid black';
      popup.style.boxSizing = 'border-box';
      popup.style.width = '60%';  // 固定宽度
      popup.style.height = '70%'; // 固定高度
      popup.style.display = 'flex';
      popup.style.flexDirection = 'column';
      popup.style.overflow = 'hidden'; // 防止整个弹窗滚动
      
      Object.assign(popup.style, config.popup.style);
      
      const headerDiv = document.createElement('div');
      headerDiv.style.display = 'flex';
      headerDiv.style.justifyContent = 'flex-end';
      headerDiv.style.padding = '10px';
      headerDiv.style.position = 'sticky';
      headerDiv.style.top = '0';
      headerDiv.style.backgroundColor = 'inherit';
      headerDiv.style.zIndex = '1';

      const copyButton = document.createElement('button');
      copyButton.textContent = config.copyButton.text;
      Object.assign(copyButton.style, config.copyButton.style);
      
      // 处理复制按钮点击事件
      copyButton.addEventListener('click', function() {
        // 获取要复制的内容
        const fullText = testCase.trim();
        
        // 删除空行
        const cleanedText = fullText.split('\n').filter(line => line.trim() !== '').join('\n');
        
        navigator.clipboard.writeText(cleanedText).then(function() {
          showCopySuccessMessage();
          closePopup();
          removeButton();
        }).catch(function(err) {
          console.error('Failed to copy text: ', err);
          showErrorMessage(config.messages.copyFailed);
        });
      });
      
      headerDiv.appendChild(copyButton);
      
      const contentDiv = document.createElement('div');
      contentDiv.style.flexGrow = '1';
      contentDiv.style.overflow = 'auto'; // 允许内容滚动
      contentDiv.style.paddingTop = '10px';
      contentDiv.style.paddingRight = '10px'; // 为可能的垂直滚动条留出空间
      
      const mindMap = createMindMap(testCase);
      contentDiv.appendChild(mindMap);
      
      popup.appendChild(headerDiv);
      popup.appendChild(contentDiv);
      document.body.appendChild(popup);
      
      document.addEventListener('click', closePopupOnClickOutside);
    }

    // 创建思维导图
    function createMindMap(testCase) {
      const lines = testCase.split('\n');
      const root = document.createElement('div');
      root.className = 'mind-map';
      
      let currentLevel = 0;
      let currentElement = root;
      let parents = [root];
      
      for (let line of lines) {
        const level = line.search(/\S/);
        const text = line.trim();
        
        // 跳过空白行
        if (text === '') {
            continue; // 如果是空行，跳过
        }
        
        // 创建节点
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'node';
        
        const contentSpan = document.createElement('span');
        contentSpan.textContent = text;
        contentSpan.className = 'node-content';
        
        // 根据文本内容设置缩进
        if (text.toLowerCase().startsWith('case')) {
          nodeDiv.classList.add('case-node');
          // case 行不缩进
        } else if (
            text.toLowerCase().startsWith('前置条件') || 
            text.toLowerCase().startsWith('行动') || 
            text.toLowerCase().startsWith('预期结果')
        ) {
            nodeDiv.style.marginLeft = '20px'; // 缩进
        } else {
            nodeDiv.style.marginLeft = 20*2 + 'px'; // 缩进
        }
        
        nodeDiv.appendChild(contentSpan);
        currentElement.appendChild(nodeDiv);
        currentLevel = level;
      }
      
      return root;
    }

    // 更新样式
    const style = document.createElement('style');
    style.textContent = `
      .mind-map {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        padding: 10px;
      }
      .node {
        margin: 5px 0;
        padding: 5px;
        border-radius: 4px;
        background-color: #f9f9f9;
        transition: background-color 0.3s;
      }
      .node:hover {
        background-color: #f0f0f0;
      }
      .case-node {
        background-color: #e7f3ff;
        border-left: 3px solid #1a73e8;
      }
      .case-node:hover {
        background-color: #d0e7ff;
      }
      .children {
        margin-left: 20px;
        padding-left: 10px;
        border-left: 1px dashed #ccc;
      }
      .toggle-button, .copy-button {
        margin-right: 5px;
        cursor: pointer;
        background: none;
        border: 1px solid #ccc;
        border-radius: 3px;
        font-size: 12px;
        padding: 0 3px;
      }
      .copy-button {
        background-color: #4CAF50;
        color: white;
        border: none;
        padding: 2px 5px;
      }
      .node-content {
        display: inline-block;
        vertical-align: middle;
      }
      .test-case-content pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: monospace;
        margin: 0;
      }
    `;
    document.head.appendChild(style);

    // 显示复制成功消息
    function showCopySuccessMessage() {
      showMessage(config.messages.copySuccess, '#4CAF50');
    }

    // 显示错误消息
    function showErrorMessage(message) {
      showMessage(message, '#f44336');
    }

    // 显示消息
    function showMessage(message, backgroundColor) {
      const messageEl = document.createElement('div');
      messageEl.textContent = message;
      messageEl.style.position = 'fixed';
      messageEl.style.zIndex = '10001';
      messageEl.style.left = '50%';
      messageEl.style.top = '20px';
      messageEl.style.transform = 'translateX(-50%)';
      messageEl.style.padding = '10px 20px';
      messageEl.style.backgroundColor = backgroundColor;
      messageEl.style.color = 'white';
      messageEl.style.borderRadius = '5px';
      messageEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      
      document.body.appendChild(messageEl);
      
      setTimeout(() => {
        document.body.removeChild(messageEl);
      }, 3000);
    }

    // 关闭弹窗
    function closePopup() {
      if (popup && popup.parentNode) {
        popup.parentNode.removeChild(popup);
        popup = null;
        document.removeEventListener('click', closePopupOnClickOutside);
      }
    }

    // 点击外部关闭弹窗
    function closePopupOnClickOutside(event) {
      if (popup && !popup.contains(event.target) && event.target !== button) {
        closePopup();
      }
    }

    // 处理鼠标抬起事件
    function handleMouseUp(event) {
      console.log('Mouse up event triggered');
      const selectedText = window.getSelection().toString().trim();
      console.log('Selected text:', selectedText);
      if (selectedText && !button) {
        if (config && config.button) {
          showButton(event);
        } else {
          console.error('Config or button configuration is missing');
        }
      } else if (!selectedText && button) {
        removeButton();
      }
    }

    // 处理鼠标按下事件
    function handleMouseDown(event) {
      console.log('Mouse down event triggered');
      if (button && !button.contains(event.target)) {
        removeButton();
      }
    }

    // 初始化
    console.log('Calling initialize function');
    initialize();
})();