export interface ImageDescriberPromptPreset {
  id: string;
  label: string;
  prompt: string;
}

export interface ImageDescriberLanguageOption {
  value: string;
  label: string;
}

export interface ImageDescriberCopy {
  action: {
    describe: string;
    shortcut: string;
  };
  history: {
    view: string;
    title: string;
    description: string;
    loading: string;
    emptyTitle: string;
    emptyDescription: string;
    unsupportedTitle: string;
    unsupportedDescription: string;
  };
  prompt: {
    title: string;
    multiSelect: string;
    placeholder: string;
    presets: ImageDescriberPromptPreset[];
  };
  language: {
    label: string;
    placeholder: string;
  };
  results: {
    listLabel: string;
    unknownTime: string;
    unknownType: string;
    descriptionTitle: string;
    descriptionEmpty: string;
    copy: string;
    remove: string;
    copyAll: string;
    exportCsv: string;
    exportJson: string;
    clear: string;
    export: {
      noResults: string;
      success: string;
      filenamePrefix: string;
      columns: {
        filename: string;
        description: string;
        size: string;
        type: string;
        modified: string;
      };
    };
    copyToast: {
      allTitle: string;
      allDescription: string;
      itemTitle: string;
      itemDescription: string;
    };
  };
  status: {
    waiting: {
      label: string;
      text: string;
    };
    uploading: {
      label: string;
      text: string;
    };
    processing: {
      label: string;
      text: string;
    };
    done: {
      label: string;
      text: string;
    };
    error: {
      label: string;
      text: string;
    };
  };
  errors: {
    uploadFailed: string;
    generationFailed: string;
    streamUnavailable: string;
    guestFreeQuotaExceeded: string;
    signedInFreeQuotaExceeded: string;
  };
  dropzone: {
    title: string;
    cta: string;
    hint: string;
    dragHint: string;
    addMore: string;
    addMoreHint: string;
    dropToAdd: string;
    errors: {
      type: string;
      size: string;
      limit: string;
    };
  };
}

export interface UploadedImageAsset {
  objectUrl: string;
  objectKey?: string;
}

export const DEFAULT_LANGUAGE_OPTIONS: ImageDescriberLanguageOption[] = [
  { value: 'English', label: 'English' },
  { value: '中文', label: '中文' },
  { value: 'Deutsch', label: 'Deutsch' },
  { value: 'Español', label: 'Español' },
  { value: 'Français', label: 'Français' },
  { value: '日本語', label: '日本語' },
  { value: '한국어', label: '한국어' },
  { value: 'Nederlands', label: 'Nederlands' },
  { value: 'Português', label: 'Português' },
  { value: 'Русский', label: 'Русский' },
  { value: 'Türkçe', label: 'Türkçe' },
  { value: 'Suomi', label: 'Suomi' },
  { value: 'Italiano', label: 'Italiano' },
  { value: 'Indonesia', label: 'Indonesia' },
];

export const getFileKey = (file: File) => {
  return `${file.name}-${file.size}-${file.lastModified}`;
};

export const splitDescription = (description: string) => {
  return description
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
};

export const formatTemplate = (
  template: string,
  values?: Record<string, string | number>
) => {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined || value === null ? '' : String(value);
  });
};
