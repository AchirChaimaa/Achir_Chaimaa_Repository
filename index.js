#!/usr/bin/env node
import axios from "axios";
import inquirer from "inquirer";

const API = "https://pokeapi.co/api/v2";
const START_HP = 300;
const MOVES_COUNT = 5;

function randInt(max) {
  return Math.floor(Math.random() * max);
}

async function getPokemon(name) {
  const { data } = await axios.get(`${API}/pokemon/${name.toLowerCase()}`);
  return data;
}

async function getMove(url) {
  const { data } = await axios.get(url);
  return { name: data.name, power: data.power, accuracy: data.accuracy };
}

function nice(s) {
  return s.replace(/-/g, " ");
}

async function pickFiveMoves(pokemonData) {
  const pool = [...pokemonData.moves].sort(() => Math.random() - 0.5);
  const chosen = [];
  for (const m of pool) {
    if (chosen.length >= MOVES_COUNT) break;
    try {
      const mv = await getMove(m.move.url);
      if (typeof mv.power === "number" && typeof mv.accuracy === "number") {
        chosen.push(mv);
      }
    } catch (_) {}
  }
  if (chosen.length < MOVES_COUNT) {
    throw new Error("Pas assez d'attaques valides trouvées pour ce Pokémon.");
  }
  return chosen.slice(0, MOVES_COUNT);
}

function miss(accuracy) {
  const r = Math.floor(Math.random() * 101);
  return accuracy < r;
}

async function main() {
  console.log("=== Mini jeu Pokémon (CLI) ===\n");

  // Choix du joueur
  const { pname } = await inquirer.prompt([{
    type: "input",
    name: "pname",
    message: "Entre le nom de TON Pokémon (ex: pikachu, charizard, gengar) :"
  }]);

  const player = await getPokemon(pname.trim());
  const botNames = ["blastoise", "venusaur", "arcanine", "alakazam", "dragonite", "machamp", "snorlax", "garchomp"];
  const bot = await getPokemon(botNames[randInt(botNames.length)]);

  const playerMoves = await pickFiveMoves(player);
  const botMoves = await pickFiveMoves(bot);

  let php = START_HP;
  let bhp = START_HP;

  console.log(`\nTu: ${player.name.toUpperCase()}  HP:${php}`);
  console.log(`Bot: ${bot.name.toUpperCase()}     HP:${bhp}\n`);

  while (php > 0 && bhp > 0) {
    // Tour joueur
    const { mv } = await inquirer.prompt([{
      type: "list",
      name: "mv",
      message: "Choisis ton attaque :",
      choices: playerMoves.map(m => ({
        name: `${nice(m.name)}  (Pow:${m.power}  Acc:${m.accuracy}%)`,
        value: m
      }))
    }]);

    if (miss(mv.accuracy)) {
      console.log(`Ton ${nice(mv.name)} rate.`);
    } else {
      bhp = Math.max(0, bhp - mv.power);
      console.log(`Tu infliges ${mv.power} dégâts. Bot HP: ${bhp}/${START_HP}`);
    }
    if (bhp <= 0) break;

    // Tour bot
    const bmv = botMoves[randInt(botMoves.length)];
    if (miss(bmv.accuracy)) {
      console.log(`Le ${nice(bmv.name)} du bot rate.`);
    } else {
      php = Math.max(0, php - bmv.power);
      console.log(`Le bot inflige ${bmv.power} dégâts. Ton HP: ${php}/${START_HP}`);
    }
    console.log("");
  }

  if (php <= 0 && bhp <= 0) console.log("Match nul.");
  else if (bhp <= 0) console.log("Victoire !");
  else console.log("Défaite...");
}

main().catch(err => {
  console.error("Erreur:", err.message || err);
  process.exit(1);
});
