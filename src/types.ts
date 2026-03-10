export interface GridImage {
  id: string;
  url: string;
  filename: string;
  title: string;
}

export interface GridSettings {
  columns: number;
  dynamicColumns: boolean;
  layoutMode: 'grid' | 'strip';
  stripImageWidth: number;
  gap: number;
  backgroundColor: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  showTitles: boolean;
  titlePosition: 'top' | 'bottom' | 'overlay';
  titleRegex: string;
  titleRegexReplace: string;
  titleColor: string;
  titleFontSize: number;
  aspectRatio: string;
  objectFit: 'cover' | 'contain' | 'fill';
}
