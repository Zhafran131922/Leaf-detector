declare module 'tflite-react-native' {
  export default class Tflite {
    loadModel(
      params: {
        model: string;
        labels: string;
        numThreads?: number;
      },
      callback: (err: any, res: any) => void
    ): void;

    runModelOnImage(
      params: {
        path?: string;
        base64?: string;
        imageMean?: number;
        imageStd?: number;
        numResults?: number;
        threshold?: number;
      },
      callback: (err: any, res: any) => void
    ): void;
  }
}
