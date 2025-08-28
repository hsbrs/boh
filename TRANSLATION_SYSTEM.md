# Translation System (i18n)

## Overview
A comprehensive internationalization (i18n) system for the OFSM application, supporting English and German languages with React Context API and localStorage persistence.

## Features

### 🌍 **Core Functionality**
- **Bilingual Support**: English and German language support
- **Language Persistence**: User language preference saved in localStorage
- **Default Language**: German (as requested by user)
- **Global Context**: React Context API for app-wide language state
- **Automatic Wrapping**: Language context automatically wraps entire application
- **Translation Scope**: All pages except `@admin/` (as per user requirements)

### 🔧 **Technical Implementation**

#### **Architecture**
- **React Context API**: Global state management for language preference
- **Custom Hooks**: `useTranslation` and `useLanguage` for easy access
- **JSON Translation Files**: Nested object structure for maintainability
- **localStorage Integration**: Persistent language preference across sessions

#### **File Structure**
```
lib/i18n/
  ├── context/
  │   └── LanguageContext.tsx    # Main context provider
  ├── hooks/
  │   └── useTranslation.ts      # Translation hook
  └── translations/
      ├── en.json                # English translations
      └── de.json                # German translations
```

### 📁 **Translation File Organization**

#### **Nested Object Structure**
The translation files use a nested object structure that mirrors the application's file and route structure:

```json
{
  "common": {
    "loading": "Loading...",
    "save": "Save"
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome back"
  },
  "vacation": {
    "title": "Vacation",
    "form": {
      "startDate": "Start Date",
      "endDate": "End Date"
    },
    "status": {
      "pending": "Pending",
      "approved": "Approved"
    }
  },
  "landing": {
    "brandName": "Broos Project",
    "features": {
      "projectManagement": {
        "title": "Project Management",
        "description": "Streamline your workflow..."
      }
    }
  }
}
```

#### **Benefits of This Structure**
- **Maintainability**: Easy to find and update specific translations
- **Scalability**: Simple to add new sections and keys
- **Consistency**: Mirrors application architecture
- **Developer Experience**: Intuitive key naming (e.g., `t('vacation.form.startDate')`)

### 🎯 **Implementation Details**

#### **LanguageContext.tsx**
```typescript
interface LanguageContextType {
  language: Language;           // 'en' | 'de'
  setLanguage: (lang: Language) => void;
  t: (key: string) => any;     // Translation function
}
```

**Key Features:**
- **Default Language**: Set to German (`'de'`)
- **localStorage Integration**: Automatically loads/saves user preference
- **Fallback System**: Falls back to English if translation not found
- **Type Safety**: TypeScript interfaces for better development experience

#### **useTranslation Hook**
```typescript
export const useTranslation = () => {
  const { language } = useLanguage();
  
  const t = (key: string): any => {
    // Translation logic with fallback
  };
  
  return { t, language };
};
```

**Usage in Components:**
```typescript
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';

const MyComponent = () => {
  const { t, language } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.welcome')}</p>
    </div>
  );
};
```

#### **LanguageToggle Component**
```typescript
export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  variant = 'ghost',
  size = 'sm',
  className = '',
}) => {
  const { language, setLanguage } = useLanguage();
  
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'de' : 'en');
  };
  
  return (
    <Button onClick={toggleLanguage}>
      <GlobeIcon className="h-4 w-4 mr-2" />
      {language === 'en' ? 'DE' : 'EN'}
    </Button>
  );
};
```

### 🚀 **Integration Points**

#### **Root Layout Integration**
```typescript
// app/layout.tsx
import { LanguageProvider } from "@/lib/i18n/context/LanguageContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
```

#### **Dashboard Layout Integration**
```typescript
// app/dashboard/layout.tsx
import { LanguageToggle } from '@/components/LanguageToggle';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Language Toggle Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-end">
          <LanguageToggle variant="ghost" size="sm" />
        </div>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 📝 **Translation Process**

#### **Adding New Translations**
1. **Identify the text** that needs translation
2. **Choose appropriate key** following the nested structure
3. **Add to both language files** (`en.json` and `de.json`)
4. **Update component** to use `t('key.path')` instead of hardcoded text

#### **Example Translation Addition**
```typescript
// Before (hardcoded)
<h1>Project Management</h1>

// After (translated)
<h1>{t('projects.title')}</h1>
```

**Translation files update:**
```json
// en.json
{
  "projects": {
    "title": "Project Management"
  }
}

// de.json
{
  "projects": {
    "title": "Projektmanagement"
  }
}
```

### 🔍 **Advanced Features**

#### **String Interpolation**
For dynamic content with variables:

```typescript
// Translation key
"pendingRequests": "You have {count} pending request{plural}"

// Component usage
<p>{t('vacation.pendingRequests')
  .replace('{count}', vacationStats.pending.toString())
  .replace('{plural}', vacationStats.pending !== 1 ? 's' : '')}</p>
```

#### **Array Translations**
For lists and arrays:

```typescript
// Translation key (array)
"benefits": {
  "list": [
    "Real-time project tracking",
    "Role-based access control",
    "Mobile-responsive design"
  ]
}

// Component usage with safety check
{Array.isArray(t('landing.benefits.list')) ? 
  t('landing.benefits.list').map((benefit, index) => (
    <div key={index}>{benefit}</div>
  )) : 
  <div>Loading...</div>
}
```

### 🛠 **Troubleshooting**

#### **Common Issues**

1. **"t(...).map is not a function"**
   - **Cause**: Translation not loaded yet or returning wrong type
   - **Solution**: Add Array.isArray() check before calling .map()

2. **Translation not changing**
   - **Cause**: Component not wrapped in LanguageProvider
   - **Solution**: Ensure component is within the provider tree

3. **Translation key not found**
   - **Cause**: Key doesn't exist in translation files
   - **Solution**: Add missing key to both `en.json` and `de.json`

4. **TypeScript errors**
   - **Cause**: Incorrect typing in LanguageContext
   - **Solution**: Use `any` return type for `t` function to handle various return types

#### **Debugging Tips**
- Check browser console for errors
- Verify translation keys exist in both language files
- Ensure LanguageProvider wraps the component tree
- Check localStorage for saved language preference

### 📊 **Current Translation Coverage**

#### **Translated Pages**
- ✅ **Landing Page** (`app/page.tsx`)
- ✅ **Dashboard** (`app/dashboard/page.tsx`)
- ✅ **Vacation System** (`app/dashboard/vacation/`)
  - ✅ Main page (`page.tsx`)
  - ✅ Request form (`VacationRequestForm.tsx`)
  - ✅ Request list (`VacationRequestList.tsx`)

#### **Translation Categories**
- ✅ **Common UI elements** (buttons, labels, messages)
- ✅ **Navigation items** (sidebar, menu items)
- ✅ **Dashboard content** (cards, descriptions, statistics)
- ✅ **Vacation system** (forms, statuses, messages)
- ✅ **Landing page** (hero, features, benefits, footer)
- ✅ **Error messages** and validation texts
- ✅ **Success messages** and confirmations

### 🔮 **Future Enhancements**

#### **Planned Features**
- **More Languages**: Support for additional languages (French, Spanish, etc.)
- **RTL Support**: Right-to-left language support (Arabic, Hebrew)
- **Dynamic Loading**: Lazy-load translations for better performance
- **Translation Management**: Admin interface for managing translations
- **Auto-translation**: Integration with translation services (Google Translate API)

#### **Integration Opportunities**
- **CMS Integration**: Connect with content management systems
- **User Preferences**: Allow users to set language per session
- **Browser Language Detection**: Auto-detect user's preferred language
- **Translation Analytics**: Track which translations are used most

### 🎯 **Best Practices**

#### **Translation Key Naming**
- Use descriptive, hierarchical keys
- Follow the pattern: `section.subsection.item`
- Keep keys consistent across components
- Use lowercase with dots for separation

#### **Component Implementation**
- Always use the `useTranslation` hook
- Provide fallback content for loading states
- Handle array translations safely with type checks
- Use string interpolation for dynamic content

#### **Maintenance**
- Keep both language files in sync
- Review translations for consistency
- Test both languages thoroughly
- Document any special translation requirements

## Support

For technical support or translation requests, please contact the development team or create an issue in the project repository.

---

*This translation system provides a robust foundation for internationalizing the OFSM application, making it accessible to both English and German-speaking users while maintaining code quality and developer experience.*
