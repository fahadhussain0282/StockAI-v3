export var MARKETPLACE_REGISTRY = {
    general: {
        id: 'general',
        name: 'General / Universal',
        shortName: 'General',
        iconName: 'Globe',
        titleMinLength: 5,
        titleMaxLength: 200,
        keywordMinCount: 10,
        keywordMaxCount: 50,
        descriptionRequired: true,
        categoriesRequired: true,
        categories: [
            'Abstract', 'Animals/Wildlife', 'Arts/Entertainment', 'Backgrounds/Textures',
            'Buildings/Landmarks', 'Business/Finance', 'Education', 'Food/Drink',
            'Healthcare/Medical', 'Holidays/Events', 'Industry/Craft', 'Nature/Outdoors',
            'People', 'Religion/Spirituality', 'Science/Technology', 'Sports/Recreation',
            'Technology', 'Transportation', 'Vectors/Illustrations'
        ],
        csvColumns: ['Filename', 'Title', 'Description', 'Keywords', 'Categories'],
        specialNotes: 'Standard universal metadata format compatible with most microstock agencies.'
    },
    'adobe-stock': {
        id: 'adobe-stock',
        name: 'Adobe Stock',
        shortName: 'Adobe Stock',
        iconName: 'SiAdobestock',
        titleMinLength: 5,
        titleMaxLength: 200,
        keywordMinCount: 5,
        keywordMaxCount: 50,
        descriptionRequired: false,
        categoriesRequired: true,
        categories: [
            'Animals', 'Buildings and Architecture', 'Business', 'Drinks', 'Environment',
            'States of Mind', 'Food', 'Graphic Resources', 'Hobbies and Leisure',
            'Industry', 'Landscape', 'Lifestyle', 'People', 'Plants and Flowers',
            'Culture and Religion', 'Science', 'Social Issues', 'Sports', 'Technology',
            'Transport', 'Travel'
        ],
        csvColumns: ['Filename', 'Title', 'Keywords', 'Category', 'Releases'],
        specialNotes: 'Keywords must be ordered by relevance. First 10 keywords are critical for search ranking.'
    },
    shutterstock: {
        id: 'shutterstock',
        name: 'Shutterstock',
        shortName: 'Shutterstock',
        iconName: 'SiShutterstock',
        titleMinLength: 5,
        titleMaxLength: 200,
        keywordMinCount: 7,
        keywordMaxCount: 50,
        descriptionRequired: true,
        categoriesRequired: true,
        categories: [
            'Abstract', 'Animals/Wildlife', 'Arts/Entertainment', 'Backgrounds/Textures',
            'Beauty/Fashion', 'Buildings/Landmarks', 'Business/Finance', 'Celebrities',
            'Editorial', 'Education', 'Food/Drink', 'Healthcare/Medical', 'Holidays',
            'Illustrations/Vectors', 'Industrial', 'Interiors', 'Miscellaneous', 'Nature',
            'Objects', 'Parks/Outdoor', 'People', 'Religion', 'Science', 'Signs/Symbols',
            'Sports/Recreation', 'Technology', 'Transportation', 'Vintage'
        ],
        csvColumns: ['Filename', 'Description', 'Keywords', 'Categories', 'Editorial', 'Illustration', 'Mature Content'],
        specialNotes: 'Shutterstock uses the Description field as the main title on product pages.'
    },
    freepik: {
        id: 'freepik',
        name: 'Freepik',
        shortName: 'Freepik',
        iconName: 'SiFreepik',
        titleMinLength: 10,
        titleMaxLength: 100,
        keywordMinCount: 10,
        keywordMaxCount: 50,
        descriptionRequired: false,
        categoriesRequired: false,
        categories: [
            'Vectors', 'Photos', 'PSD', 'Icons', '3D Models'
        ],
        csvColumns: ['Filename', 'Title', 'Keywords'],
        specialNotes: 'Freepik requires concise commercial titles and clean vector/photo tags without repetitive spam.'
    },
    vecteezy: {
        id: 'vecteezy',
        name: 'Vecteezy',
        shortName: 'Vecteezy',
        iconName: 'Vector',
        titleMinLength: 10,
        titleMaxLength: 100,
        keywordMinCount: 5,
        keywordMaxCount: 50,
        descriptionRequired: true,
        categoriesRequired: true,
        categories: [
            'Backgrounds', 'Banners', 'Patterns', 'Icons', 'Silhouettes', 'Infographics',
            'Textures', 'Logos', 'Posters', 'Flyers', 'Cards', 'Framing', 'Nature', 'Business'
        ],
        csvColumns: ['Filename', 'Title', 'Description', 'Keywords', 'License Type'],
        specialNotes: 'Vecteezy favors explicit technical vector tags (e.g., EPS10, vector background, scalable).'
    },
    pond5: {
        id: 'pond5',
        name: 'Pond5',
        shortName: 'Pond5',
        iconName: 'Video',
        titleMinLength: 5,
        titleMaxLength: 150,
        keywordMinCount: 10,
        keywordMaxCount: 50,
        descriptionRequired: true,
        categoriesRequired: true,
        categories: [
            'Aerial/Drone', 'Animals/Wildlife', 'Architecture', 'Business/Corporate',
            'Cinematic/Mood', 'Technology/Future', 'Nature/Landscape', 'People/Lifestyle',
            'Slow Motion', '4K/Ultra HD', 'VFX/Backgrounds'
        ],
        csvColumns: ['OriginalFilename', 'Title', 'Description', 'Keywords', 'Category', 'Price', 'ModelRelease', 'PropertyRelease'],
        specialNotes: 'Pond5 stock video requires motion-specific keywords (camera angles, speed, lighting, 4k).'
    },
    getty: {
        id: 'getty',
        name: 'Getty Images / iStock',
        shortName: 'Getty Images',
        iconName: 'Camera',
        titleMinLength: 5,
        titleMaxLength: 200,
        keywordMinCount: 5,
        keywordMaxCount: 50,
        descriptionRequired: true,
        categoriesRequired: false,
        categories: ['Creative', 'Editorial'],
        csvColumns: ['Filename', 'Title', 'Description', 'Keywords', 'Country', 'Date Created'],
        specialNotes: 'Getty uses controlled vocabulary indexing.'
    },
    dreamstime: {
        id: 'dreamstime',
        name: 'Dreamstime',
        shortName: 'Dreamstime',
        iconName: 'Image',
        titleMinLength: 5,
        titleMaxLength: 100,
        keywordMinCount: 5,
        keywordMaxCount: 80,
        descriptionRequired: true,
        categoriesRequired: true,
        categories: ['Arts & Architecture', 'Business', 'Editorial', 'Illustrations & Clipart', 'IT & Computer', 'Nature', 'People', 'Technology'],
        csvColumns: ['Filename', 'Title', 'Description', 'Keywords', 'Category1', 'Category2'],
        specialNotes: 'Supports up to 2 distinct categories.'
    }
};
