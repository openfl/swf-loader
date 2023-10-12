# SWF loader for Webpack

Generates an asset library from a _.swf_ file that may be loaded by [OpenFL](https://www.npmjs.com/package/openfl).

# Usage

Install this _swf-loader_ module into your Webpack project using the following command.

```sh
npm install --save-dev swf-loader
```

Then, in your _webpack.config.js_ file, add the following rule to allow _.swf_ files to be imported using _swf-loader_.

```js
module: {
	rules: [
		{ test: /\.swf$/, loader: 'swf-loader' }
	]
}
```

Finally, import a _.swf_ file and load it using the `openfl.utils.AssetLibrary` class.

```js
import Sprite from "openfl/display/Sprite";
import AssetLibrary from "openfl/utils/AssetLibrary";
import myLibraryPath from "./assets/myLibrary.swf";

class MySprite extends Sprite {
	constructor() {
		super();
		AssetLibrary.loadFromFile(myLibraryPath)
			.onComplete((library) => {
				const mc = library.getMovieClip("MyAnimation");
				this.addChild(mc);
			})
			.onError(e => console.error(e));
	}
}
```