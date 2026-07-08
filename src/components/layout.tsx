export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        本站代码以{' '}
        <a
          href="https://github.com/phhandong/turtle-soup-ai/blob/main/LICENSE"
          rel="noreferrer"
          target="_blank"
        >
          GNU GPL v3
        </a>
        <a
          href="https://github.com/phhandong/turtle-soup-ai"
          rel="noreferrer"
          target="_blank"
        >
          源码仓库
        </a>{' '}
        汤题内容改写自各来源站点，版权归原站点所有；开源协议仅适用于本站代码。
        {/* <a href="https://beian.miit.gov.cn/" rel="noreferrer" target="_blank">
          浙ICP备2024119220号
        </a> */}
      </p>
      {/* <p className="footer-note"> */}
      {/* </p> */}
      <div className="footer-sponsors" aria-label="本站赞助者">
        <span>感谢赞助</span>
        <a
          className="footer-sponsor"
          href="https://github.com/MengAnXiang"
          rel="noreferrer"
          target="_blank"
        >
          <img
            src="https://github.com/MengAnXiang.png?size=96"
            alt="MengAnXiang 的 GitHub 头像"
          />
          <span>MengAnXiang</span>
        </a>
        <a
          className="footer-sponsor"
          href="https://github.com/Wan-LR"
          rel="noreferrer"
          target="_blank"
        >
          <img
            src="https://github.com/Wan-LR.png?size=96"
            alt="Wan-LR 的 GitHub 头像"
          />
          <span>Wan-LR</span>
        </a>
      </div>
    </footer>
  )
}
