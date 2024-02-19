require('dotenv').config(); // Import and configure dotenv

const projectId = process.env.PROJECT_ID;
const location = 'us';
const processorId = process.env.PROCESSOR_ID;

const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;

// Instantiates a client
const client = new DocumentProcessorServiceClient();

async function quickstart(filePath) { // Add filePath as an argument
  console.log('Starting document processing...');

  try {
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

    console.log('Processor name:', name);

    // Read the file into memory.
    const fs = require('fs').promises;
    const imageFile = await fs.readFile(filePath);

    console.log('File read successfully.');

    // Convert the image data to a Buffer and base64 encode it.
    const encodedImage = Buffer.from(imageFile).toString('base64');

    console.log('Image data encoded successfully.');

    const request = {
      name,
      rawDocument: {
        content: encodedImage,
        mimeType: 'application/pdf',
      },
    };

    console.log('Sending document processing request...');

    // Recognizes text entities in the PDF document
    const [result] = await client.processDocument(request);
    const { document } = result;

    console.log('Document processed successfully.');

    // Get all of the document text as one big string
    const { text } = document;

    console.log('Extracting text from the document...');

    // Extract shards from the text field
    const getText = textAnchor => {
      if (!textAnchor.textSegments || textAnchor.textSegments.length === 0) {
        return '';
      }

      // First shard in document doesn't have startIndex property
      const startIndex = textAnchor.textSegments[0].startIndex || 0;
      const endIndex = textAnchor.textSegments[0].endIndex;

      return text.substring(startIndex, endIndex);
    };

    // Read the text recognition output from the processor
    console.log('The document contains the following paragraphs:');
    const [page1] = document.pages;
    const { paragraphs } = page1;

    for (const paragraph of paragraphs) {
      const paragraphText = getText(paragraph.layout.textAnchor);
      console.log(`Paragraph text:\n${paragraphText}`);
    }

    console.log('Document processing complete.');
  } catch (error) {
    console.error('Error processing document:', error);
    throw error; // Re-throw the error to handle it in the calling function if needed
  }
}

module.exports = quickstart; // Export the quickstart function
