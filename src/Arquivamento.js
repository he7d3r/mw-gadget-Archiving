/**
 * Insere um link no topo da página para listar os tópicos da esplanada que já podem ser arquivados
 * @author: [[User:Helder.wiki]]
 * @tracking: [[Special:GlobalUsage/User:Helder.wiki/Tools/Arquivamento.js]] ([[File:User:Helder.wiki/Tools/Arquivamento.js]])
 */
/*jslint browser: true, white: true, devel: true, plusplus: true*/
/*global mediaWiki, jQuery */
( function ( mw, $ ) {
'use strict';

function checkDateOfLastEdit( data ) {
	var	page, pages, pageids, i, topicDate, daysSinceLastComment,
		milisecondsInOneDay = 1000*60*60*24,
		max = prompt( 'Deseja que a lista contenha tópicos cuja última edição ocorreu há mais de quantos dias?', '20' ) || 20,
		today = new Date(),
		toArchive = [],
		text = '';
	if ( data.error !== undefined ) {
		text = 'Erro ao usar a API: ' + data.error.code + '. ' + data.error.info;
	} else if ( data.query && data.query.pages && data.query.pageids ) {
		pages = data.query.pages;
		pageids = data.query.pageids;
		for (i = 0; i < pageids.length; i++) {
			page = pages[ pageids[i] ];
			if ( page.pageid ) {
				topicDate = new Date( page.revisions[0].timestamp );
				daysSinceLastComment = Math.floor( ( today.getTime() - topicDate.getTime() )/milisecondsInOneDay );
				if ( daysSinceLastComment > max ) {
					toArchive.push(
						'<tr><td><a href="' + mw.util.getUrl( page.title ) + '?diff=0">' +
						page.title.substr( mw.config.get('wgPageName').length + 1 ) + '</a></td><td>' + daysSinceLastComment + '</td></tr>'
					);
				}
			}
		}
		if ( toArchive.length > 0 ) {
			text = 'Os tópicos abaixo foram editados pela última vez há mais de ' + max + ' dias.' +
				' Por favor arquive as discussões que já foram concluídas.\n' +
				'<table class="wikitable sortable"><thead><tr>' +
				'<th class="headerSort" title="Ordenar por ordem ascendente">Tópico</th>' +
				'<th class="headerSort" title="Ordenar por ordem ascendente">Dias sem edições</th>' +
				'</tr></thead><tbody>' +
				toArchive.join( '\n' ) +
				'</tbody></table>';
		} else {
			text = 'Todos os tópicos desta página foram editados pela última há menos de ' + (max + 1) + ' dias.';
		}
	} else {
		text = 'Houve um erro inesperado ao usar a API.';
	}
	$('#mw-content-text')
		.prepend( text )
		.find( 'table' ).tablesorter();
	mw.notify( 'Pronto!' );
}

function getListOfTopicsAndCheckDateOfLastEdit(){
	var urlPrefix = mw.config.get( 'wgServer' ) + mw.config.get( 'wgArticlePath' ).replace('$1', ''),
		topics = [];

	$('h2+div p').find('a:first').each(function(){
		topics.push( decodeURIComponent( $(this).attr('href').replace( urlPrefix, '' ) ) );
	});
	if ( topics.length === 0 ) {
		mw.notify( 'Não foi encontrado nenhum tópico nesta página' );
		return;
	}
	( new mw.Api() ).get({
		action: 'query',
		titles: topics.join( '|' ),
		prop: 'revisions',
		rvprop: 'timestamp',
		indexpageids: '1'
	})
	.done( checkDateOfLastEdit )
	.fail( function() {
		mw.notify( 'Houve um erro ao tentar usar a API para acessar a página atual.' );
	} );
}

if ($.inArray(mw.config.get('wgAction'), ['view', 'submit', 'purge']) !== -1) {
	$( mw.util.addPortletLink(
		'p-cactions',
		'#',
		'Listar tópicos a arquivar',
		'ca-archive-list',
		'Listar tópicos que possivelmente já podem ser arquivados'
	) ).click( function (e) {
		e.preventDefault();
		mw.loader.using( ['mediawiki.api', 'jquery.tablesorter'], getListOfTopicsAndCheckDateOfLastEdit );
	} );
}

}( mediaWiki, jQuery ) );