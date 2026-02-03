document.addEventListener('DOMContentLoaded', function() {
    const compileBtn = document.getElementById('compile-btn');
    const expressionInput = document.getElementById('expression');
    const examples = document.querySelectorAll('.example');
    examples.forEach(example => {
        example.addEventListener('click', function() {
            expressionInput.value = this.getAttribute('data-expr');
            expressionInput.focus();
        });
    });
    compileBtn.addEventListener('click', compileExpression);
    expressionInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            compileExpression();
        }
    });
    function compileExpression() {
        const expression = expressionInput.value.trim();
        
        if (!expression) {
            showError('Please enter an arithmetic expression');
            return;
        }
        
        try {
            clearResults();
            displayStep('input-expr', expression);
            const tokens = tokenize(expression);
            displayStep('tokens', tokens.join(' '));
            const postfix = infixToPostfix(tokens);
            displayStep('postfix', postfix.join(' '));
            const result = evaluatePostfixWithVisualization(postfix);
            displayResult(result);
        } catch (error) {
            showError(error.message);
        }
    }
    function displayStep(elementId, content) {
        const element = document.getElementById(elementId);
        element.textContent = content;
    }
    function displayResult(result) {
        const resultElement = document.getElementById('result');
        resultElement.innerHTML = `
            <span class="result-value">${result}</span>
        `;
    }
    function showError(message) {
        const resultElement = document.getElementById('result');
        resultElement.innerHTML = `
            <span class="error">
                <i class="fas fa-exclamation-circle"></i> ${message}
            </span>
        `;
    }
    function clearResults() {
        document.getElementById('input-expr').textContent = '';
        document.getElementById('tokens').textContent = '';
        document.getElementById('postfix').textContent = '';
        document.getElementById('postfix-steps').innerHTML = '';
        document.getElementById('result').textContent = '';
    }
    function tokenize(expression) {
        const tokens = [];
        let currentToken = '';
        for (let i = 0; i < expression.length; i++) {
            const char = expression[i];
            if (char === ' ') {
                continue; // skip whitespace
            }
            if (isDigit(char) || char === '.') {
                currentToken += char;
            } else if (isOperator(char) || char === '(' || char === ')') {
                if (currentToken !== '') {
                    tokens.push(currentToken);
                    currentToken = '';
                }
                tokens.push(char);
            } else {
                throw new Error(`Invalid character: ${char}`);
            }
        }
        if (currentToken !== '') {
            tokens.push(currentToken);
        }
        return tokens;
    }
    function isDigit(char) {
        return /[0-9.]/.test(char);
    }
    function isOperator(char) {
        return ['+', '-', '*', '/', '^'].includes(char);
    }
    function getPrecedence(operator) {
        const precedences = {
            '^': 4,
            '*': 3,
            '/': 3,
            '+': 2,
            '-': 2
        };
        return precedences[operator] || 0;
    }
    function infixToPostfix(tokens) {
        const output = [];
        const operatorStack = [];
        for (const token of tokens) {
            if (isDigit(token[0])) { // Number
                output.push(token);
            } else if (token === '(') {
                operatorStack.push(token);
            } else if (token === ')') {
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                    output.push(operatorStack.pop());
                }
                operatorStack.pop(); // Remove '(' from stack
            } else { // Operator
                while (operatorStack.length > 0 && 
                       getPrecedence(operatorStack[operatorStack.length - 1]) >= getPrecedence(token) &&
                       operatorStack[operatorStack.length - 1] !== '(') {
                    output.push(operatorStack.pop());
                }
                operatorStack.push(token);
            }
        }
        while (operatorStack.length > 0) {
            output.push(operatorStack.pop());
        }
        return output;
    }
    function evaluatePostfixWithVisualization(postfix) {
        const stack = [];
        const stepsContainer = document.getElementById('postfix-steps');
        stepsContainer.innerHTML = '';
        for (let i = 0; i < postfix.length; i++) {
            const token = postfix[i];
            const stepCard = document.createElement('div');
            stepCard.className = 'step-card';           
            if (isDigit(token[0])) { // Number
                stack.push(parseFloat(token));
                stepCard.innerHTML = `
                    <div class="step-header">Step ${i+1}: Push operand</div>
                    <div class="operation">Token: ${token} (operand)</div>
                    <div class="operation">Action: Push to stack</div>
                    ${createStackVisualization(stack)}
                `;
            } else { // Operator
                const b = stack.pop();
                const a = stack.pop();               
                if (a === undefined || b === undefined) {
                    throw new Error('Invalid expression');
                }              
                let result;
                switch (token) {
                    case '+': result = a + b; break;
                    case '-': result = a - b; break;
                    case '*': result = a * b; break;
                    case '/': 
                        if (b === 0) throw new Error('Division by zero');
                        result = a / b; 
                        break;
                    case '^': result = Math.pow(a, b); break;
                    default: throw new Error(`Unknown operator: ${token}`);
                }               
                stack.push(result);
                stepCard.innerHTML = `
                    <div class="step-header">Step ${i+1}: Apply operator</div>
                    <div class="operation">Token: ${token} (operator)</div>
                    <div class="operation">Action: Pop ${b}, then pop ${a}</div>
                    <div class="operation">Calculate: ${a} ${token} ${b} = ${result}</div>
                    <div class="operation">Push result to stack</div>
                    ${createStackVisualization(stack)}
                `;
            }            
            stepsContainer.appendChild(stepCard);
        }       
        if (stack.length !== 1) {
            throw new Error('Invalid expression');
        }       
        return stack[0];
    }   
    function createStackVisualization(stack) {
        if (stack.length === 0) return '<div class="stack-visual">(empty stack)</div>';    
        const items = stack.map((item, index) => {
            const className = index === stack.length - 1 ? 'stack-item top-item' : 'stack-item';
            return `<div class="${className}">${item}</div>`;
        }).join('');  
        return `
            <div class="stack-visual">
                <div>Stack (top first):</div>
                ${items}
            </div>
        `;
    }
});