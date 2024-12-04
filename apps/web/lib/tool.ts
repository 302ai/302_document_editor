import Papa from 'papaparse';
import mammoth from 'mammoth';


// Download the form
export const onDownloadTable = (csvData: string, name: string, t) => {
  // Convert object array to CSV string
  function convertToCSV(data) {
    const headers = Object.keys(data[0]).join(",") + "\n"; // Get header
    const rows = data.map(row => Object.values(row).join(",")).join("\n"); // Retrieve data for each row
    return headers + rows;
  }

  const rows: any = Papa.parse(csvData, {
    comments: '```',
    skipEmptyLines: true,
  })
  if (rows.data.length) {
    const longestSublistIndex = rows.data.reduce((maxIndex: number, sublist: any, index: number, array: any[]) => {
      return sublist.length > array[maxIndex].length ? index : maxIndex;
    }, 0);
    const transposedData = rows.data[longestSublistIndex].map((_: any, colIndex: number) => rows.data.map((row: any) => row[colIndex]));
    const nonEmptyColumnIndices = transposedData.map((col: any, index: number) => col.some((cell: any) => cell) ? index : -1)
      .filter((index: number) => index !== -1);

    const tableData = rows.data.map((row: any) => nonEmptyColumnIndices.map((index: number) => row[index]))
      .filter((sublist: any) => !sublist.every((cell: any) => cell && cell?.trim()?.indexOf('---') > -1));

    const filename = `${name || t('Untitled')}.csv`;
    // Create and download CSV files
    const csvContent = convertToCSV(tableData);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Generate download link
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const exportJSON = (title: string, novelContent: string, t) => {
  const jsonData = JSON.parse(novelContent);
  jsonData.isEditor = true;
  if (title) {
    jsonData.title = title;
  }

  const jsonString = JSON.stringify(jsonData, null, 2);

  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title || t('Untitled')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const docxToHtml = async (file: File) => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const options = {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Heading 1'] => h2:fresh",
        "p[style-name='Heading 2'] => h3:fresh"
      ],
      convertImage: mammoth.images.imgElement((image) => {
        return image.read("base64").then((imageBuffer) => {
          return {
            src: `data:${image.contentType};base64,${imageBuffer}`,
            style: "max-width: 100%; height: auto;"
          };
        });
      }),
      includeDefaultStyleMap: true,
      preserveStyles: true
    };

    const result = await mammoth.convertToHtml({ arrayBuffer }, options);
    let html = result.value;

    // Processing base64 images in HTML
    html = await processBase64Images(html);

    return html;
  } catch (error) {
    console.error("Conversion error:", error);
    throw error;
  }
};

// Processing base64 images
const processBase64Images = async (html: string): Promise<string> => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = doc.getElementsByTagName('img');

    for (const img of Array.from(images)) {
      if (img.src.startsWith('data:')) {
        const file = await base64ToFile(img.src);
        const imageUrl = await uploadImage(file);
        img.src = imageUrl;
      }
    }

    return doc.body.innerHTML;
  } catch (error) {
    console.error('Processing image error:', error);
    throw error;
  }
};

//Convert base64 to File
const base64ToFile = async (base64String: string): Promise<File> => {
  //Extract MIME types and data from base64
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string');
  }

  const contentType = matches[1];
  const base64Data = matches[2];

  // Convert base64 to binary
  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });

  const filename = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${contentType.split('/')[1]}`;

  return new File([blob], filename, { type: contentType });
};

const uploadImage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const fetchUrl = process.env.NEXT_PUBLIC_UPLOAD_API_URL;
    console.log('============>>>>>>>>>>fetchUrl', fetchUrl);

    const response = await fetch(fetchUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    return result.data.url;
  } catch (error) {
    console.error('Upload image error:', error);
    throw error;
  }
};