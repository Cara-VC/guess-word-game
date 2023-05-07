const Api = (() => {
    const url = "https://random-word-api.herokuapp.com/word"
    function getData(){
        const getTheData = fetch(url).then((res) => res.json())
        //                   .then((data) => {console.log(data); return data});
        return getTheData
    }

    return { getData }
})();

//document.getElementById("timer-number").textContent ="test time"
const View = (() => {
    let domSelector = {
        counter:".counter",
        wordLayout:".flex-word-to-guess",
        inputBox:"#user-input",
        btn: "#btn-new-game",
        guessedHistory: ".guessed-history",
        guessedHistoryLetters: ".guessed-history--letters",
        timer: "#timer",
        successList: "#success-list"
    }

    // Layout the current word
    const creatWordTmp = (arr) => {
        let temp=''
        arr.forEach((char,idx) => {
            temp += 
            `<span>${char}</span>
            `;
        });
        return temp
    }

    // Layout the counter
    const creatCounterTmp = (num) => {
        return `<span id="counter">your chance: ${num} / 10</span>`
    }

    // Layout the guessed history
    const creatGuessHistoryTmp = (arr) => {
        if(!arr) return '<span>No History</span>'

        let [letters, correctly] = arr
        let temp=''
        for(let i=0; i<letters.length; i++){
            temp+= `<span class="guessed-history--letters--${correctly[i]}">
                    ${letters[i]}</span>`
        }
        return temp
    }

    const creatSuccessListTmp = (arr) => {
        if(!arr) return '<p>No record. Start the game!</p>'
        if(arr.length===0) return `<p>No record. Start the game!</p>`

        let temp=''
        arr.forEach((char,idx) => {
            temp += 
            `<p>${char}</p>
            `;
        });
        return temp
    }

    // Show guessed-history
    const showGuessedHistory = () => {
        let guessedHistoryDiv = document.getElementById("guessed-history");
        let hidden = guessedHistoryDiv.getAttribute("hidden");
        
        if (hidden) {
            guessedHistoryDiv.removeAttribute("hidden");
        }
    }

    // Hide guessed-history
    const hideGuessedHistory = () => {
        let guessedHistoryDiv = document.getElementById("guessed-history");
        let hidden = guessedHistoryDiv.getAttribute("hidden");
    
        if (!hidden) {
            guessedHistoryDiv.setAttribute("hidden", "hidden");
        }
    }

    const render = (ele, template) =>{
        ele.innerHTML = template;
    }

    return { domSelector, creatWordTmp, creatCounterTmp, render, showGuessedHistory, 
        hideGuessedHistory, creatGuessHistoryTmp, creatSuccessListTmp}
})();

const Model = ((api, view) => {
    const { domSelector, creatWordTmp, creatCounterTmp, render, showGuessedHistory, 
        hideGuessedHistory, creatGuessHistoryTmp, creatSuccessListTmp } = view;
    const { getData } =api

    class State{
        constructor(){
            this._currentWord = ["w","o","r","l","d"];
            this._blankPlace = new Set([1,2]);
            this._attemptTimes = 0;
            this._successWords = [];
            this._guessedLetters = [[],[]];
            this._nIntervId = null;
        }
        get curState(){
            return {
                currentWord: this._currentWord,
                blankPlace: this._blankPlace,
                attemptTimes: this._attemptTimes,
                successWords: this._successWords,
                guessedLetters: this._guessedLetters
            }
        }
        set newGame(newWord){
            this._currentWord = newWord.split('');
            this._blankPlace = this.getNewBlankSet(newWord.length);
            this._attemptTimes = 0;
            this._successWords = [];
            this._guessedLetters = [[],[]];

            clearInterval(this._nIntervId);
            this._nIntervId = null;
            document.getElementById("timer-number").textContent=60;

            // Rerender the success list
            this.rerenderSuccessList()

            // Rerender the Guess History
            this.clearGuessHistory()
            hideGuessedHistory()

            // Rerender the word place
            this.rerenderWord()

            // Rerender the counter place
            this.rerenderCounter()
        }

        // Set a new timer
        beginTimer(){
            if (!this._nIntervId) {
                this._nIntervId = setInterval(() => {
                    if(document.getElementById("timer-number").textContent>0){
                        document.getElementById("timer-number").textContent -= 1
                    } else {
                        alert(`Time is out, you have guessed ${this._successWords.length} words.\nStart a new game?`);
                        clearInterval(this._nIntervId);
                        this._nIntervId = null;
                        getData().then((data) => {
                            this.newGame = data[0];
                        });
                        document.getElementById("timer-number").textContent=60;
                    }
                },1000)
            }
        }

        // Get current word
        curWord(){
            let arr=[]
            for(let i=0;i<this._currentWord.length;i++){
                if(this._blankPlace.has(i)){
                    arr.push("_")
                } else {
                    arr.push(this._currentWord[i])
                }
            }
            return arr
        }

        // Rerender the word place
        rerenderWord(){
            let wordPlace = document.querySelector(domSelector.wordLayout);
            let wordTmp = creatWordTmp(this.curWord());
            render(wordPlace, wordTmp)
        }

        // Rerender the counter place
        rerenderCounter(){
            let counterPlace = document.querySelector(domSelector.counter);
            let counterTmp = creatCounterTmp(this._attemptTimes)
            render(counterPlace, counterTmp)
        }

        // Rerender the Guess History
        rerenderGuessHistory(){
            let guessHistoryPlace = document.querySelector(domSelector.guessedHistoryLetters)
            let guessHistoryTmp = creatGuessHistoryTmp(this._guessedLetters)
            render(guessHistoryPlace, guessHistoryTmp)
        }

        // Rerender the successful list
        rerenderSuccessList(){
            let successListPlace = document.querySelector(domSelector.successList)
            let successListTmp = creatSuccessListTmp(this._successWords)
            render(successListPlace, successListTmp)
        }        

        // Clear the Guessed History
        clearGuessHistory(){
            let guessHistoryPlace = document.querySelector(domSelector.guessedHistoryLetters)
            let guessHistoryTmp = creatGuessHistoryTmp("<span>No History</span>")
            render(guessHistoryPlace, guessHistoryTmp)
        }

        chancePlusOne(){
            this._attemptTimes +=1 ;
            // Rerender the counter place
            this.rerenderCounter()
        }

        // This function will check is the char in word, and refresh "counter" and "flex-word-to-guess" 
        checkCharInWord(char){
            if(this._successWords.length===0 && this._guessedLetters[0].length===0){
                this.beginTimer()
            }

            if(new Set(this._guessedLetters[0]).has(char)){
                alert("You have guessed this letter, try another one")
                return
            }

            let curWordIdx = this._guessedLetters[0].length
            this._guessedLetters[0].push(char)
            this._guessedLetters[1].push(false)
            let isCharIn = false;
            for(let idx of this._blankPlace){
                if(this._currentWord[idx]===char){
                    isCharIn = true;
                    this._blankPlace.delete(idx);
                    this._guessedLetters[1][curWordIdx] = true
                }
            }
            if(isCharIn){
                // Rerender the word place
                this.rerenderWord()
            } else {
                this._attemptTimes += 1
                // Rerender the counter place
                this.rerenderCounter()
            }

            // Handle the change of guessed history
            if(this._guessedLetters[0].length===1) showGuessedHistory()
            this.rerenderGuessHistory()
        }

        // If current round success, add current word to string and bigin a new round
        successAndSetNewRound(newWord){
            this._successWords.push(this._currentWord.join(''));
            this._currentWord = newWord.split('');
            this._blankPlace = this.getNewBlankSet(newWord.length);
            this._guessedLetters = [[],[]];

            // Rerender the success list
            this.rerenderSuccessList()
            
            // Rerender the Guess History
            this.clearGuessHistory()
            hideGuessedHistory()

            // Rerender the word place
            this.rerenderWord()
        }

        // optimize the algorithm later
        // This function return random no duplicate numbers with random length(less than arg)
        getNewBlankSet(length){
            let arr = Array.from(new Array(length).keys())
            arr.sort(function() {
                return .5 - Math.random();
            });
        
            function rand(max) {
                // 1<=result<max,
                return Math.floor(Math.random()*(max-1))+1;
            }
        
            // at least 1 letter will keep in the word
            return new Set(arr.slice(0,rand(length)))
            
            // For test. Give a word with only one blank.
            //return new Set(arr.slice(0,1))
        }
    }

    return { State, getData }
})(Api, View);

const Controller = ((view, model) => {
    const { domSelector } = view;
    const { State, getData } = model;

    const state = new State();

    const init = () => {
        getData().then((data) => {
            state.newGame = data[0];
        });
    }

    // Listen to user input and handle it
    const handleUserInput = () => {
        const userInput = document.querySelector(domSelector.inputBox);

        userInput.addEventListener('keypress', (event) => {
            if(state.curState.attemptTimes>10){
                alert('Game over, click the button to start a new game');
                userInput.value=""
            } else if(userInput.value && userInput.value.length!==0){
                state.checkCharInWord(userInput.value)
                if(state.curState.attemptTimes>10){
                    alert(`Game over, you have guessed ${state.curState.successWords.length} words`)
                    getData().then((data) => {
                        state.newGame = data[0];
                    });
                } else if (state.curState.blankPlace.size===0) {
                    getData().then((data) => {
                        state.successAndSetNewRound(data[0]);
                    });
                }
                userInput.value=""
            }
        })
    }

    // Listen to click "new game"
    const setNewGame = () => {
        const deleteButton = document.querySelector(domSelector.btn);

        //console.log('deleteButton: ', deleteButton)
        deleteButton.addEventListener('click', () => {
            getData().then((data) => {
                state.newGame = data[0];
            });
        })
    }

    const bootstrap = () => {
        init();
        handleUserInput();
        setNewGame();
    }

    return { bootstrap }

})(View, Model);

Controller.bootstrap();