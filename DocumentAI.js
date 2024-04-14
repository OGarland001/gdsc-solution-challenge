require('dotenv').config(); // Import and configure dotenv

const projectId = process.env.PROJECT_ID;
const location = 'us';
const processorId = process.env.PROCESSOR_ID;

const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;

// Instantiates a client
const client = new DocumentProcessorServiceClient();

async function quickstart(filePath) {
  try {
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

    const fs = require('fs').promises;
    const imageFile = await fs.readFile(filePath);
    const encodedImage = Buffer.from(imageFile).toString('base64');

    const request = {
      name,
      rawDocument: {
        content: encodedImage,
        mimeType: 'application/pdf',
      },
    };

    const [result] = await client.processDocument(request);
    const { document } = result;
    const { text } = document;

    const getText = (document, textAnchor) => {
      if (!textAnchor.textSegments || textAnchor.textSegments.length === 0) {
        return '';
      }
      const startIndex = textAnchor.textSegments[0].startIndex || 0;
      const endIndex = textAnchor.textSegments[0].endIndex;
      return document.text.substring(startIndex, endIndex);
    };

    let documentContent = ''; // Accumulator for the document content

    for (const page of document.pages) {
      for (const paragraph of page.paragraphs) {
        const paragraphText = getText(document, paragraph.layout.textAnchor);
        documentContent += paragraphText + '\n'; // Append paragraph text to the accumulator
      }
    }

    return documentContent; // Return the accumulated document content
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

module.exports = quickstart; // Export the quickstart function
