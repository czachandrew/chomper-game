import React, { useState, useEffect, useRef } from "react";
import { Heart } from "lucide-react";
import coryChomp from "./assets/cory_chomp.png";
import coryDefault from "./assets/cory_default.png";
import dickPic from "./assets/dick.png";
import jizzPic from "./assets/sperm.png";
import poopPic from "./assets/poopy.png";
import yummySound from "./assets/yummy.mp3";
import heartPic from "./assets/heart.png";
import smoothiePic from "./assets/smoothie.png";
import buttPic from "./assets/butt.png";
import justicePic from "./assets/justice.png";
import owSound from "./assets/ouch.wav";
import gameOverSound from "./assets/game_over.m4a";
import splatterPic from "./assets/splatter_2.png"; // Brown splatter image
import sadCory from "./assets/cory_sad.png";
import wetFart from "./assets/wet-fart.mp3";

const foods = [
	{ id: "apple", src: dickPic },
	{ id: "pizza", src: jizzPic },
	{ id: "burger", src: poopPic },
	{ id: "icecream", src: buttPic },
	{ id: "taco", src: smoothiePic },
];

const hazards = [
	{ id: "bomb", src: justicePic },
	{ id: "poison", src: heartPic },
];

const Game = () => {
	const [gameState, setGameState] = useState("ready");
	const [score, setScore] = useState(0);
	const [highScore, setHighScore] = useState(0);
	const [health, setHealth] = useState(3);
	const [timeLeft, setTimeLeft] = useState(90);
	const [items, setItems] = useState([]);
	const [playerPosition, setPlayerPosition] = useState(50);
	const [isChomping, setIsChomping] = useState(false);
	const [splatters, setSplatters] = useState([]); // State for splatters

	const gameAreaRef = useRef(null);
	const animationFrameRef = useRef();
	const lastSpawnTime = useRef(0);

	const audioRef = useRef({
		munch: null,
		gameOver: null,
		ow: null,
		fart: null,
	});

	useEffect(() => {
		audioRef.current.munch = new Audio(yummySound);
		audioRef.current.gameOver = new Audio(gameOverSound);
		audioRef.current.ow = new Audio(owSound);
		audioRef.current.fart = new Audio(wetFart);

		audioRef.current.fart.preload = "auto";

		audioRef.current.munch.preload = "auto";
		audioRef.current.gameOver.preload = "auto";
		audioRef.current.ow.preload = "auto";

		return () => {
			audioRef.current.munch = null;
			audioRef.current.gameOver = null;
			audioRef.current.ow = null;
			audioRef.current.fart = null;
		};
	}, []);

	const playSound = (type) => {
		const audio = audioRef.current[type];
		if (audio) {
			audio.currentTime = 0;
			audio.play().catch(() => {});
		}
	};

	const startGame = () => {
		setGameState("playing");
		setScore(0);
		setHealth(3);
		setTimeLeft(90);
		setItems([]);
		setSplatters([]); // Clear splatters when starting a new game
	};

	const endGame = () => {
		setGameState("ended");
		if (score > highScore) {
			setHighScore(score);
			localStorage.setItem("chomperHighScore", score.toString());
		}
	};

	const handleCollision = (item) => {
		if (hazards.includes(item.type)) {
			playSound("ow");
			setHealth((prev) => {
				if (prev <= 1) {
					endGame();
					playSound("gameOver");
				}
				return prev - 1;
			});
		} else {
			setScore((prev) => prev + 1);
			setIsChomping(true);
			playSound("munch");
			setTimeout(() => setIsChomping(false), 200);
		}
	};

	const handleImageClick = (e) => {
		playSound("fart");
		const rect = e.target.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		setSplatters((prev) => [...prev, { x, y }]);
	};

	useEffect(() => {
		const storedHighScore = localStorage.getItem("chomperHighScore");
		if (storedHighScore) setHighScore(parseInt(storedHighScore));
	}, []);

	useEffect(() => {
		if (gameState !== "playing") return;

		const gameLoop = (timestamp) => {
			if (timestamp - lastSpawnTime.current > 1000) {
				const newItem = {
					id: Date.now(),
					x: Math.random() * 90 + 5,
					y: -10,
					type:
						Math.random() > 0.2
							? foods[Math.floor(Math.random() * foods.length)]
							: hazards[Math.floor(Math.random() * hazards.length)],
				};
				setItems((prev) => [...prev, newItem]);
				lastSpawnTime.current = timestamp;
			}

			setItems((prevItems) =>
				prevItems
					.map((item) => ({
						...item,
						y: item.y + 0.8,
					}))
					.filter((item) => item.y < 100)
			);

			const playerBounds = {
				left: playerPosition - 7.5,
				right: playerPosition + 7.5,
				top: 75,
				bottom: 90,
			};

			setItems((prevItems) =>
				prevItems.filter((item) => {
					if (
						item.y >= playerBounds.top &&
						item.y <= playerBounds.bottom &&
						item.x >= playerBounds.left &&
						item.x <= playerBounds.right
					) {
						handleCollision(item);
						return false;
					}
					return true;
				})
			);

			animationFrameRef.current = requestAnimationFrame(gameLoop);
		};

		animationFrameRef.current = requestAnimationFrame(gameLoop);
		return () => cancelAnimationFrame(animationFrameRef.current);
	}, [gameState, playerPosition]);

	useEffect(() => {
		if (gameState !== "playing") return;

		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					endGame();
					playSound("gameOver");
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [gameState]);

	useEffect(() => {
		const handleMouseMove = (e) => {
			if (gameState !== "playing") return;
			const rect = gameAreaRef.current.getBoundingClientRect();
			const x = ((e.clientX - rect.left) / rect.width) * 100;
			setPlayerPosition(Math.max(7.5, Math.min(92.5, x)));
		};

		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, [gameState]);

	return (
		<div className="w-full max-w-3xl mx-auto p-4">
			{gameState === "ended" && (
				<div className="text-center">
					<h1 className="text-3xl font-bold">Game Over</h1>
					<p className="text-lg mt-2">Your Score: {score}</p>
					<p className="text-lg mb-4">High Score: {highScore}</p>
					<div className="relative w-96 h-96 mx-auto">
						<img
							src={sadCory}
							alt="Game Over Background"
							className="w-full h-full object-contain"
							onClick={handleImageClick}
						/>
						{splatters.map((splatter, index) => (
							<img
								key={index}
								src={splatterPic}
								alt="Splatter"
								className="absolute w-18 h-18"
								style={{
									left: splatter.x,
									top: splatter.y,
									transform: "translate(-50%, -50%)",
									pointerEvents: "none", // Add this line
								}}
							/>
						))}
					</div>
					<button
						onClick={startGame}
						className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
					>
						Play Again
					</button>
				</div>
			)}

			{gameState === "playing" && (
				<>
					<div className="text-center mb-4">
						<div className="text-xl font-bold">Score: {score}</div>
						<div className="text-lg">High Score: {highScore}</div>
						<div className="text-lg">Time: {timeLeft}s</div>
						<div className="flex justify-center gap-2">
							{Array(health)
								.fill(0)
								.map((_, i) => (
									<Heart
										key={i}
										className="text-red-500"
										size={24}
										fill="currentColor"
									/>
								))}
						</div>
					</div>
					<div
						ref={gameAreaRef}
						className="relative w-full h-[36rem] bg-blue-100 overflow-hidden rounded-lg"
					>
						{items.map((item) => (
							<div
								key={item.id}
								className="absolute w-12 h-12 transform -translate-x-1/2"
								style={{ left: `${item.x}%`, top: `${item.y}%` }}
							>
								<img
									src={item.type.src}
									alt={item.type.id}
									className="w-full h-full object-contain"
								/>
							</div>
						))}

						<div
							className="absolute w-24 h-24 transform -translate-x-1/2"
							style={{ left: `${playerPosition}%`, bottom: "10%" }}
						>
							<img
								src={isChomping ? coryChomp : coryDefault}
								alt="character"
								className="w-full h-full object-contain"
							/>
						</div>
					</div>
				</>
			)}

			{gameState === "ready" && (
				<div className="text-center mt-4">
					<button
						onClick={startGame}
						className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
					>
						Start Game
					</button>
				</div>
			)}
		</div>
	);
};

export default Game;
