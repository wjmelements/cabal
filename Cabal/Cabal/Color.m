#import "Color.h"

@implementation Color (Cabal)

+ (Color *)enact {
    return [UIColor
        colorWithRed:124/255.0
        green:160/255.0
        blue:203/255.0
        alpha:1];
}

+ (Color *)revise {
    return [UIColor
        colorWithRed:33/255.0
        green:183/255.0
        blue:209/255.0
        alpha:1];
}

+ (Color *)reject {
    return [UIColor
        colorWithRed:213/255.0
        green:16/255.0
        blue:16/255.0
        alpha:1];
}

+ (Color *)lol {
    return [UIColor
        colorWithRed:255/255.0
        green:150/255.0
        blue:0/255.0
        alpha:1];
}

+ (Color *)skip {
    return [UIColor
        colorWithRed:255/255.0
        green:248/255.0
        blue:0/255.0
        alpha:1];
}

@end
