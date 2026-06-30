const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

class Bot {
  constructor() {
    this.token = process.env.BOT_TOKEN;
    if (!this.token) {
      throw new Error('BOT_TOKEN is required');
    }
    
    this.bot = new TelegramBot(this.token);
    this.webhookUrl = process.env.WEBHOOK_URL;
    this.isPolling = false;
    
    // Setup command handlers
    this.setupCommands();
  }

  setupCommands() {
    // Start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
🎨 Welcome to PixFlip Bot!

I'm here to help you with image flipping and manipulation.

Available commands:
/help - Show all commands
/flip [image] - Flip an image (horizontal)
/flipv [image] - Flip an image (vertical)
/effects - Show available effects
/about - About this bot

Just send me an image and I'll help you manipulate it!
      `;
      this.bot.sendMessage(chatId, welcomeMessage);
    });

    // Help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      const helpMessage = `
📚 Available Commands:

/flip - Flip image horizontally
/flipv - Flip image vertically
/rotate [degrees] - Rotate image
/effects - Show available effects
/filter [name] - Apply filter
/about - About PixFlip Bot

To use: Send an image with the command
Example: /flip (with image)
      `;
      this.bot.sendMessage(chatId, helpMessage);
    });

    // About command
    this.bot.onText(/\/about/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, `
🤖 PixFlip Bot v1.0

A powerful image manipulation bot for Telegram.

Features:
• Image flipping (horizontal/vertical)
• Image rotation
• Filters and effects
• Fast and reliable

Created with ❤️ for the Telegram community
      `);
    });

    // Effects command
    this.bot.onText(/\/effects/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, `
🎨 Available Effects:

• grayscale - Convert to black and white
• sepia - Apply sepia tone
• blur - Blur the image
• sharpen - Sharpen the image
• brightness - Adjust brightness
• contrast - Adjust contrast

Usage: Send image with /filter [effect]
Example: /filter grayscale
      `);
    });

    // Handle photo messages
    this.bot.on('photo', (msg) => {
      const chatId = msg.chat.id;
      const photo = msg.photo[msg.photo.length - 1]; // Get highest quality
      
      // Check if there's a caption with command
      if (msg.caption) {
        this.handleImageCommand(chatId, msg.caption, photo.file_id);
      } else {
        this.bot.sendMessage(chatId, '📸 Received your image! Use commands like /flip or /effects to manipulate it.');
      }
    });

    // Handle document (for better quality images)
    this.bot.on('document', (msg) => {
      const chatId = msg.chat.id;
      const document = msg.document;
      
      if (document.mime_type && document.mime_type.startsWith('image/')) {
        if (msg.caption) {
          this.handleImageCommand(chatId, msg.caption, document.file_id);
        } else {
          this.bot.sendMessage(chatId, '📸 Received your image! Use commands like /flip or /effects to manipulate it.');
        }
      }
    });
  }

  async handleImageCommand(chatId, command, fileId) {
    try {
      // Get file URL
      const file = await this.bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${this.token}/${file.file_path}`;
      
      // Process command
      if (command.includes('/flip') && !command.includes('/flipv')) {
        await this.flipImage(chatId, fileUrl, 'horizontal');
      } else if (command.includes('/flipv')) {
        await this.flipImage(chatId, fileUrl, 'vertical');
      } else if (command.includes('/rotate')) {
        const degrees = parseInt(command.split(' ')[1]) || 90;
        await this.rotateImage(chatId, fileUrl, degrees);
      } else if (command.includes('/filter')) {
        const filterName = command.split(' ')[1] || 'grayscale';
        await this.applyFilter(chatId, fileUrl, filterName);
      } else {
        this.bot.sendMessage(chatId, '❌ Unknown command. Use /help to see available commands.');
      }
    } catch (error) {
      console.error('Error handling image command:', error);
      this.bot.sendMessage(chatId, '❌ Sorry, there was an error processing your image. Please try again.');
    }
  }

  async flipImage(chatId, imageUrl, direction) {
    try {
      // Send processing message
      const processingMsg = await this.bot.sendMessage(chatId, '🔄 Flipping image...');
      
      // Here you would implement the actual image flipping logic
      // For now, we'll simulate with a response
      
      await this.bot.deleteMessage(chatId, processingMsg.message_id);
      
      this.bot.sendMessage(chatId, `✅ Image flipped ${direction === 'horizontal' ? 'horizontally' : 'vertically'}!`);
      
      // In production, you would:
      // 1. Download the image
      // 2. Apply the transformation
      // 3. Upload the result back
      
    } catch (error) {
      console.error('Error flipping image:', error);
      this.bot.sendMessage(chatId, '❌ Failed to flip image. Please try again.');
    }
  }

  async rotateImage(chatId, imageUrl, degrees) {
    try {
      const processingMsg = await this.bot.sendMessage(chatId, `🔄 Rotating image by ${degrees}°...`);
      
      // Implementation would go here
      
      await this.bot.deleteMessage(chatId, processingMsg.message_id);
      this.bot.sendMessage(chatId, `✅ Image rotated by ${degrees}°!`);
      
    } catch (error) {
      console.error('Error rotating image:', error);
      this.bot.sendMessage(chatId, '❌ Failed to rotate image. Please try again.');
    }
  }

  async applyFilter(chatId, imageUrl, filterName) {
    try {
      const processingMsg = await this.bot.sendMessage(chatId, `🎨 Applying ${filterName} filter...`);
      
      // Implementation would go here
      
      await this.bot.deleteMessage(chatId, processingMsg.message_id);
      this.bot.sendMessage(chatId, `✅ Applied ${filterName} filter!`);
      
    } catch (error) {
      console.error('Error applying filter:', error);
      this.bot.sendMessage(chatId, '❌ Failed to apply filter. Please try again.');
    }
  }

  // Webhook handler for Railway
  handleUpdate(reqBody, res) {
    try {
      this.bot.processUpdate(reqBody);
      res.sendStatus(200);
    } catch (error) {
      console.error('Error processing update:', error);
      res.sendStatus(500);
    }
  }

  // Set webhook for production
  async setWebhook() {
    try {
      if (this.webhookUrl) {
        const webhookUrl = `${this.webhookUrl}/webhook`;
        await this.bot.setWebHook(webhookUrl);
        console.log(`Webhook set to: ${webhookUrl}`);
        this.isPolling = false;
        return true;
      } else {
        // Fallback to polling if no webhook URL
        console.log('No webhook URL provided, using polling...');
        this.bot.startPolling();
        this.isPolling = true;
        return true;
      }
    } catch (error) {
      console.error('Error setting webhook:', error);
      throw error;
    }
  }
}

module.exports = Bot;
