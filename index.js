// index.js

// 1. Import library yang dibutuhkan
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

// 2. Inisialisasi Client (Bot)
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
});

// 3. Konfigurasi dari file .env
const TOKEN = process.env.DISCORD_TOKEN;
const INTRODUCTION_CHANNEL_ID = process.env.INTRODUCTION_CHANNEL_ID;
const ROLE_TO_REMOVE_ID = process.env.ROLE_TO_REMOVE_ID;

// 4. Event Listener ketika bot sudah siap dan online
client.once("ready", () => {
  console.log(`Bot siap! Login sebagai ${client.user.tag}`);
  console.log(`Mengawasi channel ID: ${INTRODUCTION_CHANNEL_ID}`);
  console.log(`Akan menghapus role ID: ${ROLE_TO_REMOVE_ID}`);
});

// 5. Event Listener utama: ketika ada pesan baru
client.on("messageCreate", async (message) => {
  try {
    // --- FILTER ---
    // Abaikan pesan dari bot atau yang bukan di channel perkenalan
    if (message.author.bot || message.channel.id !== INTRODUCTION_CHANNEL_ID) {
      return;
    }

    // --- REGEX MATCHING ---
    // Ini adalah pola Regex untuk mencocokkan format perkenalan yang baru.
    // 'i' flag = case-insensitive (Nama: | nama:)
    // 's' flag = dot matches newline (memungkinkan hobi/minat multi-baris)
    const introductionPattern = /Nama:\s*(?<nama>.*?)\n\s*Nama Panggilan:\s*(?<panggilan>.*?)\n\s*Hobi:\s*(?<hobi>.*?)\n\s*Minat:\s*(?<minat>.*)/is;

    const match = message.content.match(introductionPattern);

    // Jika pesan tidak cocok dengan pola Regex, abaikan.
    if (!match) {
      console.log(`Pesan dari ${message.author.username} tidak cocok format.`);
      // Opsional: kirim pesan balasan jika format salah
      // message.reply("Format perkenalan tidak sesuai. Harap gunakan format yang sudah ditentukan.");
      return;
    }

    // --- PARSE & EXTRACT ---
    // Ambil data dari hasil Regex menggunakan 'groups'
    const { nama, panggilan, hobi, minat } = match.groups;
    const newNickname = panggilan.trim();

    console.log(`Format perkenalan valid dari ${message.author.username}. Nama Panggilan: "${newNickname}"`);

    // Validasi: pastikan nama panggilan tidak kosong dan tidak terlalu panjang
    if (!newNickname) {
      message.reply("Nama Panggilan tidak boleh kosong!");
      return;
    }
    if (newNickname.length > 32) {
      message.reply(`Nama Panggilan terlalu panjang! (Maksimal 32 karakter)`);
      return;
    }

    // --- ACTIONS ---
    const member = message.member;

    // 1. Mengubah Nickname
    console.log(`Mengubah nickname ${member.user.username} menjadi "${newNickname}"`);
    await member.setNickname(newNickname);

    // 2. Menghapus Role
    const roleToRemove = message.guild.roles.cache.get(ROLE_TO_REMOVE_ID);
    if (!roleToRemove) {
      console.error(`Error: Role dengan ID ${ROLE_TO_REMOVE_ID} tidak ditemukan di server ini.`);
      message.reply("Admin, tolong cek konfigurasi. Role yang mau dihapus sepertinya tidak valid.");
      return; // Hentikan eksekusi jika role tidak ada
    }

    // Cek dulu apakah member punya role tersebut
    if (member.roles.cache.has(roleToRemove.id)) {
      console.log(`Menghapus role "${roleToRemove.name}" dari ${member.user.username}`);
      await member.roles.remove(roleToRemove);
    } else {
      console.log(`${member.user.username} tidak memiliki role "${roleToRemove.name}", jadi tidak ada yang dihapus.`);
    }

    // --- FEEDBACK ---
    await message.reply(`Sip, perkenalan diterima! Selamat datang **${newNickname}**. Nickname dan role kamu telah diupdate.`);
  } catch (error) {
    console.error("Terjadi error saat memproses perkenalan:", error);

    if (error.code === 50013) {
      // Missing Permissions
      message.reply("Waduh, aku nggak punya izin untuk melakukan itu. Coba kontak admin untuk memastikan role bot sudah benar (di atas role user & role target) dan punya permission `Manage Nicknames` & `Manage Roles`.");
    } else {
      message.reply("Oops, ada masalah teknis. Gagal memproses perkenalanmu.");
    }
  }
});

// 6. Login bot ke Discord
client.login(TOKEN);
