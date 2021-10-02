<script>
	let questions = [
{
		"question": "What is your height?", 
			"options": [
				"I am below average height",
				"I am average height",
				"I am above average height"
			],
				"correctIndex": 1
}, 
		{  
			"question":  "What is your fitness level?",
			"options":  [
			"To be honest I am out of shape/overweight",
			"I have an average body",
			"My body is pretty athletic"
		],
			"correctIndex": 1
	},
		{  
			"question":  "What is your game/confidence level on?",
			"options":  [
			"I am completely inexperienced/have no game",
			"I have average game with women",
			"I am extremely confident/mack-daddy skills"
			],
				"correctIndex": 1
	},
		{
			"question":  "What level is your style on?", 
			"options": [
				"I can't dress to save my life",  
				"I have average style",
				"My style is on a whole different level" 
				],
					"correctIndex": 1
	},
		{
			"question":  "What is your income?",
			"options": [
				"I don't have a job",
			"I have average income", 
			"My income is above average"
				],
				"correctIndex": 1
		},
			{
				"question": "What level of sexual experience do you have?",
			"options": [
				"I am a virgin/few bodies",
			"I have an average number of bodies",
			"I have a crazy high number of bodies"  
				],
				"correctIndex": 1
			},
				{
				"question": "Where do you rate your sexual skills?",
				"options": [
				 "I can't please a women",
				"I'm decent in the bedroom",
				"I satisfy women every single time"
				 ],
					"correctIndex": 1
			},
				{
				"question": "How pleasant is your car?",
				"options": [
				"I have no car",
				"I have decent car",  
				"I have nice car"
					],
					"correctIndex": 1
			},
				{
				"question":  "How nice is your place?",
				"options": [
					"I don't have my own place",      
					"It's decent, I guess!",
					"It's pretty impressive" 
					],
					"correctIndex": 1
			},
				{
				"question":  "How good is your social skills?",
				"options": [
					"I'm socially awkward",         
					"I'm have average social skills",     
					"I have charisma and everyone loves me" 
					],
					"correctIndex": 1 
			},
				{
					"question":  "How consistent are you on your purpose?",
					"options": [
					"I don't know my purpose",		  
					"I know it, I'm just inconsistent",
					"I'm on it like white on rice everyday" 
						],
						"correctIndex": 1
				},
					{
						"question": "How often do you smell good around women?",
					"options": [
					"Never, I lack confidence", 
					"Sometimes, depending on how I feel", 
					"I always smell good around ladies" 
						],
						"correctIndex": 1
					},
						{
							"question": "How often do you get compliments and flirts from women?",
							"options": [
							"Never, I need help!",
							"They sometimes flirt", 
							"Women flirt all of the time"
								],
								"correctIndex": 1
						},
							{
								"question": "How often do ladies text you back?",
								"options": [
								"Ladies never text me back",
								"They text back every couple of days", 
								"They always text back right away"
									],
									"correctIndex": 1
							}
							];
	let answers = new Array(questions.length).fill(null);
	let questionPointer = -1;
	function getScore(){
	let score = answers.reduce((acc,val,index)=>{
		if(questions[index].correctIndex == val){
			return acc+1;
		}
		return acc;
		},0); 
		return (score/questions.length * 100)+"%";
						}
		function restartQuiz(){
			answers = new Array(questions.length).fill(null);
			questionPointer = 0;
	}
</script>

<style>
	.app {
	position:absolute;
	top: 0px;
	left:0px;
	width:100vw;
	height:100vh;
	}
	
	.app > div {
	width:100%;
	height:100%;
		
	}
	.app .start-screen,
	.app .score-screen{
		display:flex;
		justify-content:center;
		align-items:center;
		
		background-image: linear-gradient(to bottom right, darkorange, yellow);
}
	.app .start-screen button,
	.app .score-screen button{
		padding:10px 20px;
		background-color: navy;
		color: orange;
		border: none;
		outline:none;
		border-radius: 20px;
		cursor:pointer;
		font-family: Oswald;
		font-size: 22px;
	}
	.app .quiz-screen .main{
	padding:20px;
		color:navy;
		background-image: linear-gradient(to bottom right, darkorange, yellow);
		font-family: Oswald;
		font-size: 19px;
	}
	.app .quiz-screen .main .options {
display:flex;
		justify-content:space-between;
		flex-wrap:wrap;
		
	}
	.app .quiz-screen .main .options button {
		width:35%;
		border-radius:15px;
		margin:10px 0px;
		background-color:navy;
		color:orange;
	}
	.app .quiz-screen .main .options button.selected {
		background-color: lightgray;
		color: navy;
	}
	.app .quiz-screen .footer{
		position:fixed;
		bottom:0px;
		left:0px;
		width:100%;
		height:50px;
		display:flex;
		justify-content:space-between;
		align-items:center;
		background-image: linear-gradient(to bottom right, darkorange, yellow);
	}
	.app .quiz-screen .footer > div {
	margin:0px 10px;
	}
	.app .quiz-screen .footer .progress-bar {
		width:150px;
		height:10px;
		background-color:gray;
		border-radius:10px;
		overflow:hidden;
	}
	.app .quiz-screen .footer .progress-bar div {
			height:100%;
			background-color: navy;
		}
	
	.app .score-screen{
			flex-direction:column;
	}
	.app .score-screen h1 {
			margin-bottom:10px;
	}
</style>
<div class="app">
	{#if questionPointer==-1}
	<div class="start-screen">
	<button on:click={()=>{questionPointer=0}}>
		How Desirable Are You To Women?
		</button>
		
	</div>
	{:else if !(questionPointer > answers.length-1)}
	<div class="quiz-screen">
		<div class="main">
			<h2>
				{questions[questionPointer].question}
			</h2>
			<div class="options">
				{#each questions[questionPointer].options as opt,i}
				<button class="{answers[questionPointer]==i?'selected':''}" on:click={() =>{answers[questionPointer]=i}}>
					{opt}
				</button>
				{/each}
			
		</div>
		</div>
		<div class="footer">
			<div class="progress-bar">
					<div style="width: {questionPointer/questions.length*100}%">
						
				</div>
				
		
		
		</div>
		<div class="buttons">
		<button disabled={questionPointer==0} on:click={()=>{questionPointer--}}>
			&lt;
		</button>
		<button on:click={()=>{questionPointer++}}>
			&gt;
		</button>
		</div>
		</div>
	</div>
	{:else}
		<div class="score-screen">
			<h1>
				Your results: {getScore()}
			</h1>
			<button on:click={restartQuiz}>
				Retake!
			</button>
		</div>	
	{/if}

</div>
