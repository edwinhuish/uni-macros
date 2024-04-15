import { definePagesJson } from 'vite-plugin-define-pages-json';

export default definePagesJson({
  globalStyle: {
    navigationBarTextStyle: 'black',
    navigationBarTitleText: 'uni-app',
    navigationBarBackgroundColor: '#F8F8F8',
    backgroundColor: '#F8F8F8',
  },
  pages: [ // pages数组中第一项表示应用启动页，参考：https://uniapp.dcloud.io/collocation/pages
    // {
    //   path: 'pages/index/index',
    //   style: {
    //     navigationBarTitleText: 'uni-app',
    //   },
    // },
  ],
});
